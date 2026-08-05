/**
 * Authentication service — handles registration, login, and token generation.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');

const SALT_ROUNDS = 10;

class AuthService {
  /**
   * Register a new user with hashed password
   * @param {{ name: string, email: string, password: string, role?: string }}
   */
  async register({ name, email, password, role = 'user' }) {
    if (!name?.trim() || !email?.trim() || !password) {
      throw new AppError('Name, email, and password are required', 400);
    }
    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    const existing = userRepository.findByEmail(email.toLowerCase());
    if (existing) {
      throw new AppError('Email is already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = userRepository.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
    });

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  /**
   * Authenticate user credentials and return JWT
   * @param {{ email: string, password: string }}
   */
  async login({ email, password }) {
    if (!email?.trim() || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = userRepository.findByEmail(email.toLowerCase());
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  /**
   * @param {object} user
   * @returns {string} JWT
   */
  generateToken(user) {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /** Strip sensitive fields before sending user to client */
  sanitizeUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    };
  }
}

module.exports = new AuthService();

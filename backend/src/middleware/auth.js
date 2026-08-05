/**
 * JWT authentication middleware.
 * Validates Bearer token and attaches decoded user payload to req.user.
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const { sendError } = require('../utils/apiResponse');
const userRepository = require('../repositories/userRepository');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
}

/**
 * Admin role check middleware
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireAdmin(req, res, next) {
  try {
    const user = userRepository.findById(req.user.userId);
    
    if (!user || user.role !== 'admin') {
      return sendError(res, 'Admin access required', 403);
    }
    
    next();
  } catch (err) {
    return sendError(res, 'Error checking user permissions', 500);
  }
}

module.exports = { authenticate, requireAdmin };

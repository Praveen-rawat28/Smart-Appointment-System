/**
 * Data access layer for user records.
 * Keeps SQL isolated from business logic in the service layer.
 */
const { getDatabase } = require('../database/connection');

class UserRepository {
  constructor() {
    this.db = getDatabase();
  }

  /**
   * @param {{ name: string, email: string, passwordHash: string, role?: string }}
   * @returns {{ id: number, name: string, email: string, created_at: string }}
   */
  create({ name, email, passwordHash, role = 'user' }) {
    const stmt = this.db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name, email, passwordHash, role);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * @param {number} id
   */
  findById(id) {
    return this.db.prepare(`
      SELECT id, name, email, role, created_at FROM users WHERE id = ?
    `).get(id);
  }

  /**
   * @param {string} email
   */
  findByEmail(email) {
    return this.db.prepare(`
      SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = ?
    `).get(email);
  }

  /**
   * Get all users (admin function)
   */
  findAll() {
    return this.db.prepare(`
      SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC
    `).all();
  }
}

module.exports = new UserRepository();

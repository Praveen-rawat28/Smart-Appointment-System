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
   * @param {{ name: string, email: string, passwordHash: string }}
   * @returns {{ id: number, name: string, email: string, created_at: string }}
   */
  create({ name, email, passwordHash }) {
    const stmt = this.db.prepare(`
      INSERT INTO users (name, email, password_hash)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(name, email, passwordHash);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * @param {number} id
   */
  findById(id) {
    return this.db.prepare(`
      SELECT id, name, email, created_at FROM users WHERE id = ?
    `).get(id);
  }

  /**
   * @param {string} email
   */
  findByEmail(email) {
    return this.db.prepare(`
      SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?
    `).get(email);
  }
}

module.exports = new UserRepository();

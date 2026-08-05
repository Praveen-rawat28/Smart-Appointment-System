/**
 * Data access layer for appointment slot records.
 */
const { getDatabase } = require('../database/connection');

class SlotRepository {
  constructor() {
    this.db = getDatabase();
  }

  /**
   * List slots with optional filtering and pagination
   * @param {{ date?: string, status?: string, page?: number, limit?: number }}
   */
  findAll({ date, status, page = 1, limit = 20 } = {}) {
    const conditions = [];
    const params = [];

    if (date) {
      conditions.push('slot_date = ?');
      params.push(date);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countRow = this.db.prepare(`
      SELECT COUNT(*) as total FROM appointment_slots ${where}
    `).get(...params);

    const rows = this.db.prepare(`
      SELECT id, slot_date, start_time, end_time, status, created_at
      FROM appointment_slots
      ${where}
      ORDER BY slot_date ASC, start_time ASC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return {
      slots: rows,
      pagination: {
        page,
        limit,
        total: countRow.total,
        totalPages: Math.ceil(countRow.total / limit),
      },
    };
  }

  /**
   * @param {number} id
   */
  findById(id) {
    return this.db.prepare(`
      SELECT id, slot_date, start_time, end_time, status, created_at
      FROM appointment_slots WHERE id = ?
    `).get(id);
  }

  /**
   * Atomically mark a slot as booked (used inside transactions)
   * @param {import('better-sqlite3').Database} txDb
   * @param {number} slotId
   * @returns {boolean} true if the slot was updated
   */
  markBooked(txDb, slotId) {
    const result = txDb.prepare(`
      UPDATE appointment_slots
      SET status = 'booked'
      WHERE id = ? AND status = 'available'
    `).run(slotId);
    return result.changes > 0;
  }

  /**
   * Release a slot back to available (on cancellation)
   * @param {import('better-sqlite3').Database} txDb
   * @param {number} slotId
   */
  markAvailable(txDb, slotId) {
    txDb.prepare(`
      UPDATE appointment_slots SET status = 'available' WHERE id = ?
    `).run(slotId);
  }
}

module.exports = new SlotRepository();

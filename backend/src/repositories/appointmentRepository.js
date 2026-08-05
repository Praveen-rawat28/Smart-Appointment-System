/**
 * Data access layer for appointment (booking) records.
 */
const { getDatabase } = require('../database/connection');

class AppointmentRepository {
  constructor() {
    this.db = getDatabase();
  }

  /**
   * Create a booking record inside a transaction
   * @param {import('better-sqlite3').Database} txDb
   * @param {{ userId: number, slotId: number }}
   */
  create(txDb, { userId, slotId }) {
    const result = txDb.prepare(`
      INSERT INTO appointments (user_id, slot_id, status)
      VALUES (?, ?, 'confirmed')
    `).run(userId, slotId);
    return result.lastInsertRowid;
  }

  /**
   * Get all confirmed appointments for a user with slot details
   * @param {number} userId
   */
  findByUserId(userId) {
    return this.db.prepare(`
      SELECT
        a.id,
        a.status,
        a.booked_at,
        a.cancelled_at,
        s.id AS slot_id,
        s.slot_date,
        s.start_time,
        s.end_time
      FROM appointments a
      JOIN appointment_slots s ON s.id = a.slot_id
      WHERE a.user_id = ? AND a.status = 'confirmed'
      ORDER BY s.slot_date ASC, s.start_time ASC
    `).all(userId);
  }

  /**
   * @param {number} id
   */
  findById(id) {
    return this.db.prepare(`
      SELECT
        a.id,
        a.user_id,
        a.slot_id,
        a.status,
        a.booked_at,
        a.cancelled_at,
        s.slot_date,
        s.start_time,
        s.end_time
      FROM appointments a
      JOIN appointment_slots s ON s.id = a.slot_id
      WHERE a.id = ?
    `).get(id);
  }

  /**
   * Get confirmed appointments for a user on a specific calendar date
   * @param {import('better-sqlite3').Database} txDb
   * @param {number} userId
   * @param {string} slotDate - YYYY-MM-DD
   */
  findConfirmedByUserAndDate(txDb, userId, slotDate) {
    return txDb.prepare(`
      SELECT a.id, s.start_time, s.end_time
      FROM appointments a
      JOIN appointment_slots s ON s.id = a.slot_id
      WHERE a.user_id = ? AND a.status = 'confirmed' AND s.slot_date = ?
    `).all(userId, slotDate);
  }

  /**
   * Cancel an appointment inside a transaction
   * @param {import('better-sqlite3').Database} txDb
   * @param {number} appointmentId
   */
  cancel(txDb, appointmentId) {
    txDb.prepare(`
      UPDATE appointments
      SET status = 'cancelled', cancelled_at = datetime('now')
      WHERE id = ? AND status = 'confirmed'
    `).run(appointmentId);
  }
}

module.exports = new AppointmentRepository();

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
   * @param {{ userId: number, slotId: number, subject?: string, description?: string, status?: string }}
   */
  create(txDb, { userId, slotId, subject = null, description = null, status = 'pending' }) {
    const result = txDb.prepare(`
      INSERT INTO appointments (user_id, slot_id, status, subject, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, slotId, status, subject, description);
    return result.lastInsertRowid;
  }

  /**
   * Get all appointments for a user with slot details
   * @param {number} userId
   */
  findByUserId(userId) {
    return this.db.prepare(`
      SELECT
        a.id,
        a.status,
        a.subject,
        a.description,
        a.booked_at,
        a.cancelled_at,
        a.rejected_at,
        a.alternative_slot_date,
        a.alternative_slot_start_time,
        a.alternative_slot_end_time,
        s.id AS slot_id,
        s.slot_date,
        s.start_time,
        s.end_time
      FROM appointments a
      JOIN appointment_slots s ON s.id = a.slot_id
      WHERE a.user_id = ?
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
        a.subject,
        a.description,
        a.booked_at,
        a.cancelled_at,
        a.rejected_at,
        a.alternative_slot_date,
        a.alternative_slot_start_time,
        a.alternative_slot_end_time,
        s.slot_date,
        s.start_time,
        s.end_time
      FROM appointments a
      JOIN appointment_slots s ON s.id = a.slot_id
      WHERE a.id = ?
    `).get(id);
  }

  /**
   * Get any appointments (including pending) for a user on a specific calendar date
   * @param {import('better-sqlite3').Database} txDb
   * @param {number} userId
   * @param {string} slotDate - YYYY-MM-DD
   */
  findAnyByUserAndDate(txDb, userId, slotDate) {
    return txDb.prepare(`
      SELECT a.id, s.start_time, s.end_time
      FROM appointments a
      JOIN appointment_slots s ON s.id = a.slot_id
      WHERE a.user_id = ? AND s.slot_date = ? AND a.status != 'cancelled'
    `).all(userId, slotDate);
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
   * Find pending appointment for a user on a specific slot
   */
  findPendingByUserAndSlot(txDb, userId, slotId) {
    return txDb.prepare(`
      SELECT id FROM appointments
      WHERE user_id = ? AND slot_id = ? AND status = 'pending'
    `).get(userId, slotId);
  }

  /**
   * Reject all other pending requests for a slot when one is approved
   */
  rejectOtherPendingForSlot(txDb, slotId, approvedAppointmentId) {
    txDb.prepare(`
      UPDATE appointments
      SET status = 'rejected',
          rejected_at = datetime('now')
      WHERE slot_id = ? AND status = 'pending' AND id != ?
    `).run(slotId, approvedAppointmentId);
  }

  /**
   * Cancel an appointment.
   * @param {import('better-sqlite3').Database} txDb
   * @param {number} appointmentId
   */
  cancel(txDb, appointmentId) {
    txDb.prepare(`
      UPDATE appointments
      SET status = 'cancelled', cancelled_at = datetime('now')
      WHERE id = ? AND status != 'cancelled'
    `).run(appointmentId);
  }

  /**
   * Update appointment status
   * @param {import('better-sqlite3').Database} txDb
   * @param {number} appointmentId
   * @param {string} status
   */
  updateStatus(txDb, appointmentId, status) {
    txDb.prepare(`
      UPDATE appointments
      SET status = ?
      WHERE id = ?
    `).run(status, appointmentId);
  }

  /**
   * Reject appointment with alternative slot suggestion
   * @param {import('better-sqlite3').Database} txDb
   * @param {number} appointmentId
   * @param {object} alternativeSlot - { date, startTime, endTime }
   */
  rejectWithAlternative(txDb, appointmentId, alternativeSlot) {
    if (alternativeSlot) {
      txDb.prepare(`
        UPDATE appointments
        SET status = 'rejected',
            rejected_at = datetime('now'),
            alternative_slot_date = ?,
            alternative_slot_start_time = ?,
            alternative_slot_end_time = ?
        WHERE id = ?
      `).run(alternativeSlot.date, alternativeSlot.startTime, alternativeSlot.endTime, appointmentId);
    } else {
      txDb.prepare(`
        UPDATE appointments
        SET status = 'rejected',
            rejected_at = datetime('now')
        WHERE id = ?
      `).run(appointmentId);
    }
  }

  /**
   * Request new slot for rejected appointment
   * @param {import('better-sqlite3').Database} txDb
   * @param {number} appointmentId
   * @param {number} newSlotId
   */
  requestNewSlot(txDb, appointmentId, newSlotId) {
    txDb.prepare(`
      UPDATE appointments
      SET slot_id = ?,
          status = 'pending',
          rejected_at = NULL,
          alternative_slot_date = NULL,
          alternative_slot_start_time = NULL,
          alternative_slot_end_time = NULL
      WHERE id = ?
    `).run(newSlotId, appointmentId);
  }

  /**
   * Find appointments by status
   * @param {string} status
   */
  findByStatus(status) {
    return this.db.prepare(`
      SELECT
        a.id,
        a.user_id,
        a.status,
        a.subject,
        a.description,
        a.booked_at,
        u.name AS user_name,
        u.email AS user_email,
        s.slot_date,
        s.start_time,
        s.end_time
      FROM appointments a
      JOIN appointment_slots s ON s.id = a.slot_id
      JOIN users u ON u.id = a.user_id
      WHERE a.status = ?
      ORDER BY s.slot_date ASC, s.start_time ASC
    `).all(status);
  }

  /**
   * Find all appointments (admin view)
   */
  findAll() {
    return this.db.prepare(`
      SELECT
        a.id,
        a.user_id,
        a.status,
        a.subject,
        a.description,
        a.booked_at,
        a.cancelled_at,
        a.rejected_at,
        u.name AS user_name,
        u.email AS user_email,
        s.slot_date,
        s.start_time,
        s.end_time
      FROM appointments a
      JOIN appointment_slots s ON s.id = a.slot_id
      JOIN users u ON u.id = a.user_id
      ORDER BY s.slot_date DESC, s.start_time DESC
    `).all();
  }
}

module.exports = new AppointmentRepository();

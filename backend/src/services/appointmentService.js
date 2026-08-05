/**
 * Appointment booking service — enforces all business rules with transactional safety.
 *
 * Concurrency strategy:
 * - SQLite BEGIN IMMEDIATE acquires a write lock upfront
 * - Slot status is updated with a conditional WHERE status='available'
 * - UNIQUE constraint on appointments.slot_id prevents double-booking at DB level
 */
const { getDatabase } = require('../database/connection');
const slotRepository = require('../repositories/slotRepository');
const appointmentRepository = require('../repositories/appointmentRepository');
const AppError = require('../utils/AppError');
const { isInPast, timesOverlap, isWithinCancellationWindow } = require('../utils/dateTime');
const config = require('../config');

class AppointmentService {
  /**
   * Book an appointment slot for the authenticated user
   * @param {number} userId
   * @param {number} slotId
   */
  bookAppointment(userId, slotId) {
    const db = getDatabase();

    // BEGIN IMMEDIATE ensures write lock before validation — prevents race conditions
    const book = db.transaction(() => {
      const slot = slotRepository.findById(slotId);

      if (!slot) {
        throw new AppError('Appointment slot not found', 404);
      }
      if (slot.status !== 'available') {
        throw new AppError('This slot is no longer available', 409);
      }
      if (isInPast(slot.slot_date, slot.start_time)) {
        throw new AppError('Cannot book appointments in the past', 400);
      }

      // Rule: one appointment per user per calendar day
      const sameDayAppointments = appointmentRepository.findConfirmedByUserAndDate(
        db,
        userId,
        slot.slot_date
      );
      if (sameDayAppointments.length > 0) {
        throw new AppError('You may only book one appointment per calendar day', 409);
      }

      // Rule: no overlapping appointments for the same user on the same day
      // (Also catches edge cases if data integrity were compromised)
      for (const existing of sameDayAppointments) {
        if (timesOverlap(slot.start_time, slot.end_time, existing.start_time, existing.end_time)) {
          throw new AppError('This appointment overlaps with an existing booking', 409);
        }
      }

      // Atomically claim the slot — fails if another transaction got it first
      const claimed = slotRepository.markBooked(db, slotId);
      if (!claimed) {
        throw new AppError('This slot was just booked by another user. Please choose another slot.', 409);
      }

      const appointmentId = appointmentRepository.create(db, { userId, slotId });
      return appointmentRepository.findById(appointmentId);
    });

    return book();
  }

  /**
   * List all confirmed appointments for a user
   * @param {number} userId
   */
  getUserAppointments(userId) {
    return appointmentRepository.findByUserId(userId);
  }

  /**
   * Cancel an appointment with business-rule validation
   * @param {number} userId
   * @param {number} appointmentId
   */
  cancelAppointment(userId, appointmentId) {
    const db = getDatabase();

    const cancel = db.transaction(() => {
      const appointment = appointmentRepository.findById(appointmentId);

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }
      if (appointment.user_id !== userId) {
        throw new AppError('You can only cancel your own appointments', 403);
      }
      if (appointment.status !== 'confirmed') {
        throw new AppError('This appointment is already cancelled', 400);
      }
      if (isInPast(appointment.slot_date, appointment.start_time)) {
        throw new AppError('Cannot cancel past appointments', 400);
      }
      if (!isWithinCancellationWindow(
        appointment.slot_date,
        appointment.start_time,
        config.cancellationWindowHours
      )) {
        throw new AppError(
          `Cancellation must be done at least ${config.cancellationWindowHours} hours before the appointment`,
          400
        );
      }

      appointmentRepository.cancel(db, appointmentId);
      slotRepository.markAvailable(db, appointment.slot_id);

      return { id: appointmentId, status: 'cancelled' };
    });

    return cancel();
  }
}

module.exports = new AppointmentService();

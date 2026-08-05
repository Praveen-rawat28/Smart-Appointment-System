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
const { isInPast, isWithinCancellationWindow } = require('../utils/dateTime');
const config = require('../config');

class AppointmentService {
  /**
   * Book an appointment slot for the authenticated user (creates pending appointment)
   * @param {number} userId
   * @param {number} slotId
   * @param {string} subject
   * @param {string} description
   */
  bookAppointment(userId, slotId, subject = null, description = null) {
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

      // Rule: one appointment per user per calendar day (including pending)
      const sameDayAppointments = appointmentRepository.findAnyByUserAndDate(
        db,
        userId,
        slot.slot_date
      );
      if (sameDayAppointments.length > 0) {
        throw new AppError('You may only book one appointment per calendar day', 409);
      }

      const appointmentId = appointmentRepository.create(db, { 
        userId, 
        slotId,
        subject,
        description,
        status: 'pending'
      });
      return appointmentRepository.findById(appointmentId);
    });

    return book();
  }

  /**
   * List all appointments for a user
   * @param {number} userId
   */
  getUserAppointments(userId) {
    return appointmentRepository.findByUserId(userId);
  }

  /**
   * Approve a pending appointment (admin only)
   * @param {number} appointmentId
   */
  approveAppointment(appointmentId) {
    const db = getDatabase();

    const approve = db.transaction(() => {
      const appointment = appointmentRepository.findById(appointmentId);

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }
      if (appointment.status !== 'pending') {
        throw new AppError('Only pending appointments can be approved', 400);
      }

      const claimed = slotRepository.markBooked(db, appointment.slot_id);
      if (!claimed) {
        throw new AppError('This slot is already occupied', 409);
      }

      appointmentRepository.updateStatus(db, appointmentId, 'confirmed');
      appointmentRepository.rejectOtherPendingForSlot(db, appointment.slot_id, appointmentId);
      return appointmentRepository.findById(appointmentId);
    });

    return approve();
  }

  /**
   * Reject a pending appointment with alternative time suggestion (admin only)
   * @param {number} appointmentId
   * @param {object} alternativeSlot - { date, startTime, endTime }
   */
  rejectAppointment(appointmentId, alternativeSlot = null) {
    const db = getDatabase();

    const reject = db.transaction(() => {
      const appointment = appointmentRepository.findById(appointmentId);

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }
      if (appointment.status !== 'pending') {
        throw new AppError('Only pending appointments can be rejected', 400);
      }

      appointmentRepository.rejectWithAlternative(db, appointmentId, alternativeSlot);

      return appointmentRepository.findById(appointmentId);
    });

    return reject();
  }

  /**
   * User requests new time slot after rejection
   * @param {number} appointmentId
   * @param {number} newSlotId
   */
  requestNewSlot(appointmentId, newSlotId) {
    const db = getDatabase();

    const request = db.transaction(() => {
      const appointment = appointmentRepository.findById(appointmentId);

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }
      if (appointment.status !== 'rejected') {
        throw new AppError('Only rejected appointments can request new slots', 400);
      }

      const newSlot = slotRepository.findById(newSlotId);
      if (!newSlot) {
        throw new AppError('New slot not found', 404);
      }
      if (newSlot.status !== 'available') {
        throw new AppError('This slot is no longer available', 409);
      }
      if (isInPast(newSlot.slot_date, newSlot.start_time)) {
        throw new AppError('Cannot book appointments in the past', 400);
      }

      // Check for same day conflicts
      const sameDayAppointments = appointmentRepository.findAnyByUserAndDate(
        db,
        appointment.user_id,
        newSlot.slot_date
      ).filter(appt => appt.id !== appointmentId);
      
      if (sameDayAppointments.length > 0) {
        throw new AppError('You may only book one appointment per calendar day', 409);
      }

      appointmentRepository.requestNewSlot(db, appointmentId, newSlotId);

      return appointmentRepository.findById(appointmentId);
    });

    return request();
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
      if (appointment.status === 'cancelled') {
        throw new AppError('This appointment is already cancelled', 400);
      }
      if (appointment.status === 'rejected') {
        throw new AppError('Cannot cancel rejected appointments', 400);
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
      if (appointment.status === 'confirmed') {
        slotRepository.markAvailable(db, appointment.slot_id);
      }

      return { id: appointmentId, status: 'cancelled' };
    });

    return cancel();
  }

  /**
   * Get all pending appointments (admin only)
   */
  getPendingAppointments() {
    return appointmentRepository.findByStatus('pending');
  }

  /**
   * Get all appointments (admin only)
   */
  getAllAppointments() {
    return appointmentRepository.findAll();
  }
}

module.exports = new AppointmentService();

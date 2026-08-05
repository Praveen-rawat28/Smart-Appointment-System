/**
 * Appointment controller — booking, listing, and cancellation endpoints.
 */
const appointmentService = require('../services/appointmentService');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

function bookAppointment(req, res, next) {
  try {
    const slotId = parseInt(req.body.slotId, 10);
    if (!slotId || Number.isNaN(slotId)) {
      throw new AppError('Valid slotId is required', 400);
    }

    const appointment = appointmentService.bookAppointment(req.user.userId, slotId);
    sendSuccess(res, appointment, 'Appointment booked successfully', 201);
  } catch (err) {
    next(err);
  }
}

function getMyAppointments(req, res, next) {
  try {
    const appointments = appointmentService.getUserAppointments(req.user.userId);
    sendSuccess(res, appointments, 'Appointments retrieved successfully');
  } catch (err) {
    next(err);
  }
}

function cancelAppointment(req, res, next) {
  try {
    const appointmentId = parseInt(req.params.id, 10);
    if (!appointmentId || Number.isNaN(appointmentId)) {
      throw new AppError('Valid appointment id is required', 400);
    }

    const result = appointmentService.cancelAppointment(req.user.userId, appointmentId);
    sendSuccess(res, result, 'Appointment cancelled successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = { bookAppointment, getMyAppointments, cancelAppointment };

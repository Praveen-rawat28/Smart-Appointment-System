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

    const { subject, description } = req.body;
    const appointment = appointmentService.bookAppointment(req.user.userId, slotId, subject, description);
    sendSuccess(res, appointment, 'Appointment booked successfully (pending approval)', 201);
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

// Admin functions
function approveAppointment(req, res, next) {
  try {
    const appointmentId = parseInt(req.params.id, 10);
    if (!appointmentId || Number.isNaN(appointmentId)) {
      throw new AppError('Valid appointment id is required', 400);
    }

    const appointment = appointmentService.approveAppointment(appointmentId);
    sendSuccess(res, appointment, 'Appointment approved successfully');
  } catch (err) {
    next(err);
  }
}

function rejectAppointment(req, res, next) {
  try {
    const appointmentId = parseInt(req.params.id, 10);
    if (!appointmentId || Number.isNaN(appointmentId)) {
      throw new AppError('Valid appointment id is required', 400);
    }

    const { alternativeSlot } = req.body;
    const appointment = appointmentService.rejectAppointment(appointmentId, alternativeSlot);
    sendSuccess(res, appointment, 'Appointment rejected successfully');
  } catch (err) {
    next(err);
  }
}

function requestNewSlot(req, res, next) {
  try {
    const appointmentId = parseInt(req.params.id, 10);
    const newSlotId = parseInt(req.body.slotId, 10);
    
    if (!appointmentId || Number.isNaN(appointmentId)) {
      throw new AppError('Valid appointment id is required', 400);
    }
    if (!newSlotId || Number.isNaN(newSlotId)) {
      throw new AppError('Valid slotId is required', 400);
    }

    const appointment = appointmentService.requestNewSlot(appointmentId, newSlotId);
    sendSuccess(res, appointment, 'New slot requested successfully');
  } catch (err) {
    next(err);
  }
}

function getPendingAppointments(req, res, next) {
  try {
    const appointments = appointmentService.getPendingAppointments();
    sendSuccess(res, appointments, 'Pending appointments retrieved successfully');
  } catch (err) {
    next(err);
  }
}

function getAllAppointments(req, res, next) {
  try {
    const appointments = appointmentService.getAllAppointments();
    sendSuccess(res, appointments, 'All appointments retrieved successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = { 
  bookAppointment, 
  getMyAppointments, 
  cancelAppointment,
  approveAppointment,
  rejectAppointment,
  requestNewSlot,
  getPendingAppointments,
  getAllAppointments
};

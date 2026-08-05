/**
 * Appointment routes — protected booking, listing, and cancellation.
 */
const { Router } = require('express');
const appointmentController = require('../controllers/appointmentController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

// User routes
router.post('/book', appointmentController.bookAppointment);
router.get('/my', appointmentController.getMyAppointments);
router.delete('/:id', appointmentController.cancelAppointment);
router.post('/:id/request-new-slot', appointmentController.requestNewSlot);

// Admin routes
router.get('/pending', requireAdmin, appointmentController.getPendingAppointments);
router.get('/all', requireAdmin, appointmentController.getAllAppointments);
router.post('/:id/approve', requireAdmin, appointmentController.approveAppointment);
router.post('/:id/reject', requireAdmin, appointmentController.rejectAppointment);

module.exports = router;

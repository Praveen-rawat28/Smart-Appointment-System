/**
 * Appointment routes — protected booking, listing, and cancellation.
 */
const { Router } = require('express');
const appointmentController = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.post('/book', appointmentController.bookAppointment);
router.get('/my', appointmentController.getMyAppointments);
router.delete('/:id', appointmentController.cancelAppointment);

module.exports = router;

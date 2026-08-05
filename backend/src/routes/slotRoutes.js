/**
 * Slot routes — public listing of appointment slots (with optional auth for future use).
 */
const { Router } = require('express');
const slotController = require('../controllers/slotController');

const router = Router();

router.get('/', slotController.getSlots);

module.exports = router;

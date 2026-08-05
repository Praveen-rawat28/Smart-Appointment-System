/**
 * Slot controller — handles listing of system-generated appointment slots.
 */
const slotService = require('../services/slotService');
const { sendSuccess } = require('../utils/apiResponse');

function getSlots(req, res, next) {
  try {
    const result = slotService.getSlots(req.query);
    sendSuccess(res, result, 'Slots retrieved successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = { getSlots };

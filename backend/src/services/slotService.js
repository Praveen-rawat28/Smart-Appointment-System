/**
 * Slot listing service — read-only operations for available appointment slots.
 */
const slotRepository = require('../repositories/slotRepository');
const AppError = require('../utils/AppError');

class SlotService {
  /**
   * @param {{ date?: string, status?: string, page?: number, limit?: number }}
   */
  getSlots(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));

    if (query.date && !/^\d{4}-\d{2}-\d{2}$/.test(query.date)) {
      throw new AppError('Date must be in YYYY-MM-DD format', 400);
    }
    if (query.status && !['available', 'booked'].includes(query.status)) {
      throw new AppError('Status must be "available" or "booked"', 400);
    }

    return slotRepository.findAll({
      date: query.date,
      status: query.status,
      page,
      limit,
    });
  }
}

module.exports = new SlotService();

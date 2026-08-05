/**
 * Client-side slot state helpers for UI (past, booked, bookable).
 */

/**
 * @param {string} date - YYYY-MM-DD
 * @param {string} startTime - HH:MM
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
export function isSlotInPast(date, startTime, now = new Date()) {
  const slotStart = new Date(`${date}T${startTime}:00`);
  return slotStart <= now;
}

/**
 * Resolve how a slot should render in the UI.
 * @param {{ slot_date: string, start_time: string, status: string }} slot
 * @param {{ now?: Date, userBookedDates?: Set<string>, optimisticStatus?: string|null }} options
 * @returns {'past' | 'booked' | 'day-blocked' | 'available'}
 */
export function getSlotDisplayState(slot, { now = new Date(), userBookedDates = new Set(), optimisticStatus = null } = {}) {
  const status = optimisticStatus || slot.status;

  if (isSlotInPast(slot.slot_date, slot.start_time, now)) {
    return 'past';
  }
  if (status === 'booked') {
    return 'booked';
  }
  if (userBookedDates.has(slot.slot_date)) {
    return 'day-blocked';
  }
  return 'available';
}

export const SLOT_MESSAGES = {
  past: 'This slot time has passed.',
  booked: 'This slot is already occupied.',
  'day-blocked': 'You already have an appointment on this day.',
};

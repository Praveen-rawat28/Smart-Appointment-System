/**
 * System slot generation — same weekday schedule every day (9 AM–5 PM, hourly).
 * Weekends are skipped. Safe to run repeatedly; existing slots are not duplicated.
 */
const { getDatabase } = require('./connection');

const DEFAULT_WORKDAY_START_HOUR = 9;
const DEFAULT_WORKDAY_END_HOUR = 17; // last slot ends at 17:00

/**
 * Format a Date as YYYY-MM-DD in local timezone
 * @param {Date} date
 * @returns {string}
 */
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Build slot definitions for upcoming weekdays
 * @param {number} daysAhead - calendar days to look ahead from today
 * @returns {Array<{ slot_date: string, start_time: string, end_time: string }>}
 */
function generateSlotDefinitions(daysAhead = 30) {
  const slots = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < daysAhead; offset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);

    // Skip Saturday (6) and Sunday (0)
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dateStr = formatLocalDate(date);

    for (let hour = DEFAULT_WORKDAY_START_HOUR; hour < DEFAULT_WORKDAY_END_HOUR; hour++) {
      const start = `${String(hour).padStart(2, '0')}:00`;
      const end = `${String(hour + 1).padStart(2, '0')}:00`;
      slots.push({ slot_date: dateStr, start_time: start, end_time: end });
    }
  }

  return slots;
}

/**
 * Insert missing slots for the next N days (does not overwrite booked slots)
 * @param {number} daysAhead
 * @returns {number} count of newly inserted slots
 */
function ensureUpcomingSlots(daysAhead = 30) {
  const db = getDatabase();
  const slots = generateSlotDefinitions(daysAhead);

  const insertSlot = db.prepare(`
    INSERT OR IGNORE INTO appointment_slots (slot_date, start_time, end_time, status)
    VALUES (@slot_date, @start_time, @end_time, 'available')
  `);

  const insertMany = db.transaction(() => {
    let inserted = 0;
    for (const slot of slots) {
      const result = insertSlot.run(slot);
      if (result.changes > 0) inserted++;
    }
    return inserted;
  });

  return insertMany();
}

module.exports = {
  generateSlotDefinitions,
  ensureUpcomingSlots,
  DEFAULT_WORKDAY_START_HOUR,
  DEFAULT_WORKDAY_END_HOUR,
};

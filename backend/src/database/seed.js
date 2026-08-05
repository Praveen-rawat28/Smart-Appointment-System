/**
 * Seed script — populates the database with sample appointment slots.
 * Run: npm run seed
 */
require('dotenv').config();
const { getDatabase, closeDatabase } = require('./connection');

const db = getDatabase();

/** Generate slots for the next N days, 9 AM – 5 PM in one-hour blocks */
function generateSlots(daysAhead = 14) {
  const slots = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let d = 0; d < daysAhead; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().slice(0, 10);

    // Skip weekends for variety
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (let hour = 9; hour < 17; hour++) {
      const start = `${String(hour).padStart(2, '0')}:00`;
      const end = `${String(hour + 1).padStart(2, '0')}:00`;
      slots.push({ slot_date: dateStr, start_time: start, end_time: end });
    }
  }
  return slots;
}

const insertSlot = db.prepare(`
  INSERT OR IGNORE INTO appointment_slots (slot_date, start_time, end_time, status)
  VALUES (@slot_date, @start_time, @end_time, 'available')
`);

const seed = db.transaction(() => {
  const slots = generateSlots(14);
  let inserted = 0;
  for (const slot of slots) {
    const result = insertSlot.run(slot);
    if (result.changes > 0) inserted++;
  }
  return inserted;
});

const count = seed();
console.log(`Seed complete: ${count} new appointment slots created.`);
closeDatabase();

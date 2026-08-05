/**
 * Seed script — ensures upcoming weekday slots exist (9 AM–5 PM, hourly).
 * Run: npm run seed
 */
require('dotenv').config();
const config = require('../config');
const { closeDatabase } = require('./connection');
const { ensureUpcomingSlots } = require('./slotGenerator');

const daysAhead = config.slotGenerationDays;
const count = ensureUpcomingSlots(daysAhead);

console.log(`Seed complete: ${count} new appointment slots created for the next ${daysAhead} days (weekdays only).`);
closeDatabase();

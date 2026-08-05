/**
 * Integration tests for critical appointment booking business rules.
 * Run: npm test
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

// Use isolated test database
process.env.DATABASE_PATH = path.join(__dirname, '../data/test-appointments.db');
process.env.JWT_SECRET = 'test-secret';

const { getDatabase, closeDatabase } = require('../src/database/connection');
const authService = require('../src/services/authService');
const appointmentService = require('../src/services/appointmentService');
const slotRepository = require('../src/repositories/slotRepository');

const testDbPath = process.env.DATABASE_PATH;

function resetDatabase() {
  closeDatabase();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  getDatabase();
}

function insertTestSlot(date, start, end, status = 'available') {
  const db = getDatabase();
  const result = db.prepare(`
    INSERT INTO appointment_slots (slot_date, start_time, end_time, status)
    VALUES (?, ?, ?, ?)
  `).run(date, start, end, status);
  return result.lastInsertRowid;
}

function futureDate(daysFromNow = 7) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

describe('Appointment Booking Logic', () => {
  let user1;
  let user2;

  before(async () => {
    resetDatabase();
    user1 = (await authService.register({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'password123',
    })).user;
    user2 = (await authService.register({
      name: 'Bob',
      email: 'bob@test.com',
      password: 'password123',
    })).user;
  });

  after(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });

  it('should book an available slot successfully', () => {
    const slotId = insertTestSlot(futureDate(10), '10:00', '11:00');
    const appointment = appointmentService.bookAppointment(user1.id, slotId);
    assert.equal(appointment.status, 'confirmed');
    assert.equal(appointment.user_id, user1.id);
  });

  it('should reject booking the same slot twice (concurrency)', () => {
    const slotId = insertTestSlot(futureDate(11), '10:00', '11:00');
    appointmentService.bookAppointment(user1.id, slotId);

    assert.throws(
      () => appointmentService.bookAppointment(user2.id, slotId),
      (err) => err.message.includes('no longer available') || err.message.includes('just booked')
    );
  });

  it('should enforce one appointment per user per calendar day', () => {
    const date = futureDate(12);
    const slot1 = insertTestSlot(date, '09:00', '10:00');
    insertTestSlot(date, '11:00', '12:00');

    appointmentService.bookAppointment(user1.id, slot1);

    assert.throws(
      () => appointmentService.bookAppointment(user1.id, insertTestSlot(date, '14:00', '15:00')),
      (err) => err.message.includes('one appointment per calendar day')
    );
  });

  it('should reject booking past slots', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);
    const slotId = insertTestSlot(dateStr, '10:00', '11:00');

    assert.throws(
      () => appointmentService.bookAppointment(user2.id, slotId),
      (err) => err.message.includes('past')
    );
  });

  it('should cancel within the allowed window', () => {
    const slotId = insertTestSlot(futureDate(14), '10:00', '11:00');
    const appointment = appointmentService.bookAppointment(user2.id, slotId);

    const result = appointmentService.cancelAppointment(user2.id, appointment.id);
    assert.equal(result.status, 'cancelled');

    const slot = slotRepository.findById(slotId);
    assert.equal(slot.status, 'available');
  });
});

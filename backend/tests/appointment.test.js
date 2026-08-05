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

const testDbPath = process.env.DATABASE_PATH;
let authService;
let appointmentService;
let slotRepository;

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
    authService = require('../src/services/authService');
    appointmentService = require('../src/services/appointmentService');
    slotRepository = require('../src/repositories/slotRepository');

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

  it('should create a pending request and leave the slot available', () => {
    const slotId = insertTestSlot(futureDate(10), '10:00', '11:00');
    const appointment = appointmentService.bookAppointment(user1.id, slotId);
    assert.equal(appointment.status, 'pending');
    assert.equal(appointment.user_id, user1.id);

    const slot = slotRepository.findById(slotId);
    assert.equal(slot.status, 'available');
  });

  it('should allow multiple users to request the same slot until approval', () => {
    const slotId = insertTestSlot(futureDate(11), '10:00', '11:00');
    const first = appointmentService.bookAppointment(user1.id, slotId);
    const second = appointmentService.bookAppointment(user2.id, slotId);

    assert.equal(first.status, 'pending');
    assert.equal(second.status, 'pending');
    assert.equal(slotRepository.findById(slotId).status, 'available');
  });

  it('should occupy the slot only after admin approval', () => {
    const slotId = insertTestSlot(futureDate(12), '10:00', '11:00');
    const first = appointmentService.bookAppointment(user1.id, slotId);
    const second = appointmentService.bookAppointment(user2.id, slotId);

    const approved = appointmentService.approveAppointment(first.id);

    assert.equal(approved.status, 'confirmed');
    assert.equal(slotRepository.findById(slotId).status, 'booked');
    assert.equal(appointmentService.getUserAppointments(user2.id).find((appt) => appt.id === second.id).status, 'rejected');
  });

  it('should enforce one appointment per user per calendar day', () => {
    const date = futureDate(13);
    const slot1 = insertTestSlot(date, '09:00', '10:00');
    insertTestSlot(date, '11:00', '12:00');

    appointmentService.bookAppointment(user1.id, slot1);

    assert.throws(
      () => appointmentService.bookAppointment(user1.id, insertTestSlot(date, '14:00', '15:00')),
      (err) => err.message.includes('one appointment per calendar day')
    );
  });

  it('should allow booking another same-day slot after rejection', () => {
    const date = futureDate(15);
    const slot1 = insertTestSlot(date, '09:00', '10:00');
    const slot2 = insertTestSlot(date, '11:00', '12:00');

    const rejected = appointmentService.bookAppointment(user1.id, slot1);
    appointmentService.rejectAppointment(rejected.id);

    const nextRequest = appointmentService.bookAppointment(user1.id, slot2);

    assert.equal(nextRequest.status, 'pending');
    assert.equal(nextRequest.slot_id, slot2);
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
    appointmentService.approveAppointment(appointment.id);

    const result = appointmentService.cancelAppointment(user2.id, appointment.id);
    assert.equal(result.status, 'cancelled');

    const slot = slotRepository.findById(slotId);
    assert.equal(slot.status, 'available');
  });
});

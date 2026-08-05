/**
 * Database initialization and connection management.
 * Uses SQLite with WAL mode for improved concurrent read/write performance.
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

let db = null;

/**
 * Initialize the database schema and return the connection instance
 * @returns {import('better-sqlite3').Database}
 */
function getDatabase() {
  if (db) return db;

  const dbPath = path.resolve(config.databasePath);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initializeSchema(db);
  return db;
}

/**
 * Create tables and indexes if they do not exist
 * @param {import('better-sqlite3').Database} database
 */
function initializeSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appointment_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (slot_date, start_time, end_time)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      slot_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'rejected')),
      subject TEXT,
      description TEXT,
      booked_at TEXT NOT NULL DEFAULT (datetime('now')),
      cancelled_at TEXT,
      rejected_at TEXT,
      alternative_slot_date TEXT,
      alternative_slot_start_time TEXT,
      alternative_slot_end_time TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (slot_id) REFERENCES appointment_slots(id)
    );

    CREATE INDEX IF NOT EXISTS idx_slots_date_status ON appointment_slots(slot_date, status);
    CREATE INDEX IF NOT EXISTS idx_appointments_user_status ON appointments(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_confirmed_slot
      ON appointments(slot_id) WHERE status = 'confirmed';
  `);

  const { runMigrations } = require('./migrations');
  runMigrations(database);
}

/**
 * Close the database connection (used in tests/shutdown)
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDatabase, closeDatabase };

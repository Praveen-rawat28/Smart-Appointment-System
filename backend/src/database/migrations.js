/**
 * Database migrations for schema updates on existing SQLite databases.
 */

function runMigrations(database) {
  migrateUsersRole(database);
  migrateAppointmentsAllowMultiplePending(database);
  releaseSlotsHeldByPendingRequests(database);
}

function migrateUsersRole(database) {
  try {
    database.exec(`
      ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));
    `);
  } catch (err) {
    if (!err.message.includes('duplicate column name')) throw err;
  }
}

function migrateAppointmentsAllowMultiplePending(database) {
  const table = database.prepare(`
    SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'appointments'
  `).get();

  if (!table?.sql) return;

  const hasUniqueSlotConstraint = table.sql.includes('slot_id INTEGER NOT NULL UNIQUE');
  if (!hasUniqueSlotConstraint) {
    database.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_confirmed_slot
      ON appointments(slot_id) WHERE status = 'confirmed';
    `);
    return;
  }

  database.exec(`
    BEGIN IMMEDIATE;

    CREATE TABLE appointments_migrated (
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

    INSERT INTO appointments_migrated (
      id, user_id, slot_id, status, subject, description, booked_at,
      cancelled_at, rejected_at, alternative_slot_date,
      alternative_slot_start_time, alternative_slot_end_time
    )
    SELECT
      id, user_id, slot_id, status, subject, description, booked_at,
      cancelled_at, rejected_at, alternative_slot_date,
      alternative_slot_start_time, alternative_slot_end_time
    FROM appointments;

    DROP TABLE appointments;
    ALTER TABLE appointments_migrated RENAME TO appointments;

    CREATE INDEX IF NOT EXISTS idx_appointments_user_status ON appointments(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_confirmed_slot
      ON appointments(slot_id) WHERE status = 'confirmed';

    COMMIT;
  `);
}

/**
 * Pending requests should not hold a slot — release any legacy booked slots.
 */
function releaseSlotsHeldByPendingRequests(database) {
  database.exec(`
    UPDATE appointment_slots
    SET status = 'available'
    WHERE status = 'booked'
      AND id IN (
        SELECT slot_id FROM appointments WHERE status = 'pending'
      )
      AND id NOT IN (
        SELECT slot_id FROM appointments WHERE status = 'confirmed'
      );
  `);
}

module.exports = { runMigrations };

/**
 * Migration script to update existing database schema
 * Run: node src/database/migrate.js
 */
require('dotenv').config();
const { getDatabase, closeDatabase } = require('./connection');

function migrate() {
  const db = getDatabase();
  
  console.log('Running database migration...');
  
  // Add role column to users table if it doesn't exist
  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));
    `);
    console.log('✓ Added role column to users table');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✓ Role column already exists in users table');
    } else {
      console.error('✗ Error adding role column:', err.message);
    }
  }
  
  // Update appointments table structure
  try {
    // SQLite doesn't support ALTER TABLE to add multiple columns or constraints easily
    // We need to recreate the table
    db.exec(`
      BEGIN TRANSACTION;
      
      -- Create new appointments table with updated schema
      CREATE TABLE IF NOT EXISTS appointments_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        slot_id INTEGER NOT NULL UNIQUE,
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
      
      -- Copy existing data
      INSERT INTO appointments_new (id, user_id, slot_id, status, booked_at, cancelled_at)
      SELECT id, user_id, slot_id, 
             CASE 
               WHEN status = 'confirmed' THEN 'confirmed'
               WHEN status = 'cancelled' THEN 'cancelled'
               ELSE 'pending'
             END,
             booked_at, 
             cancelled_at
      FROM appointments;
      
      -- Drop old table
      DROP TABLE appointments;
      
      -- Rename new table
      ALTER TABLE appointments_new RENAME TO appointments;
      
      -- Recreate indexes
      CREATE INDEX IF NOT EXISTS idx_appointments_user_status ON appointments(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id);
      
      COMMIT;
    `);
    console.log('✓ Updated appointments table with new schema');
  } catch (err) {
    console.error('✗ Error updating appointments table:', err.message);
    db.exec('ROLLBACK');
  }
  
  console.log('Migration complete!');
  closeDatabase();
}

migrate();

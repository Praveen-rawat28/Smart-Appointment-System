/**
 * Create admin user script
 * Run: node src/database/createAdmin.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDatabase, closeDatabase } = require('./connection');
const userRepository = require('../repositories/userRepository');

function createAdmin() {
  const db = getDatabase();
  
  console.log('Creating admin user...');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_NAME || 'Admin User';
  
  // Check if admin already exists
  const existing = userRepository.findByEmail(adminEmail);
  if (existing) {
    console.log('Admin user already exists:', existing.email);
    closeDatabase();
    return;
  }
  
  // Create admin user
  const passwordHash = bcrypt.hashSync(adminPassword, 10);
  const stmt = db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, 'admin')
  `);
  
  const result = stmt.run(adminName, adminEmail, passwordHash);
  const admin = userRepository.findById(result.lastInsertRowid);
  
  console.log('✓ Admin user created successfully!');
  console.log('  Email:', admin.email);
  console.log('  Password:', adminPassword);
  console.log('  (Please change the password after first login)');
  
  closeDatabase();
}

createAdmin();

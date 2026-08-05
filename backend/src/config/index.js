/**
 * Centralized application configuration.
 * Values are loaded from environment variables with sensible defaults for local development.
 */
require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  // Users must cancel at least this many hours before the appointment start time
  cancellationWindowHours: parseInt(process.env.CANCELLATION_WINDOW_HOURS, 10) || 24,
  databasePath: process.env.DATABASE_PATH || './data/appointments.db',
  nodeEnv: process.env.NODE_ENV || 'development',
  // How many calendar days ahead to auto-generate weekday slots (9 AM–5 PM)
  slotGenerationDays: parseInt(process.env.SLOT_GENERATION_DAYS, 10) || 30,
};

/**
 * Express application setup — middleware, routes, and error handling.
 */
const express = require('express');
const cors = require('cors');
const config = require('./config');
const authRoutes = require('./routes/authRoutes');
const slotRoutes = require('./routes/slotRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { getDatabase } = require('./database/connection');
const { ensureUpcomingSlots } = require('./database/slotGenerator');

const app = express();

// Initialize database and ensure weekday slots exist for upcoming days
getDatabase();
const newSlots = ensureUpcomingSlots(config.slotGenerationDays);
if (newSlots > 0) {
  console.log(`Generated ${newSlots} new appointment slots (weekdays 9 AM–5 PM).`);
}

app.use(cors());
app.use(express.json());

// Health check for deployment/monitoring
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running', data: { timestamp: new Date().toISOString() } });
});

app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/appointments', appointmentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

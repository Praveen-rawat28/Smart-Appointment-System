/**
 * Server entry point — starts the Express HTTP server.
 */
const app = require('./app');
const config = require('./config');

app.listen(config.port, () => {
  console.log(`Smart Appointment API running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

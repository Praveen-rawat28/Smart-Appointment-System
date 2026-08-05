/**
 * Centralized error-handling middleware.
 * Operational errors (AppError) return predictable client responses;
 * unexpected errors are logged and masked in production.
 */
const AppError = require('../utils/AppError');
const { sendError } = require('../utils/apiResponse');
const config = require('../config');

/**
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  // SQLite unique constraint — concurrent double-booking fallback
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return sendError(res, 'This slot was just booked by another user. Please choose another slot.', 409);
  }

  console.error('[Unhandled Error]', err);

  const message = config.nodeEnv === 'production'
    ? 'Internal server error'
    : err.message;

  return sendError(res, message, 500);
}

/** Handle 404 for undefined routes */
function notFoundHandler(req, res) {
  return sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
}

module.exports = { errorHandler, notFoundHandler };

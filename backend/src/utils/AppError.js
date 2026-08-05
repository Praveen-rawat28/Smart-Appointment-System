/**
 * Custom operational error class for predictable error handling in services.
 * Distinguishes expected business-rule violations from unexpected server failures.
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message exposed to the client
   * @param {number} [statusCode=400] - HTTP status code
   * @param {Array|object|null} [errors=null] - Optional validation details
   */
  constructor(message, statusCode = 400, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

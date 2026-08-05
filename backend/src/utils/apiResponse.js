/**
 * Standardized API response helpers.
 * All endpoints return a consistent envelope: { success, message, data, errors? }
 */

/**
 * Send a successful JSON response
 * @param {import('express').Response} res
 * @param {*} data - Payload returned to the client
 * @param {string} [message='Success']
 * @param {number} [statusCode=200]
 */
function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send an error JSON response
 * @param {import('express').Response} res
 * @param {string} message - Human-readable error message
 * @param {number} [statusCode=500]
 * @param {Array|object|null} [errors=null] - Optional validation or field errors
 */
function sendError(res, message, statusCode = 500, errors = null) {
  const body = {
    success: false,
    message,
    data: null,
  };
  if (errors) {
    body.errors = errors;
  }
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess, sendError };

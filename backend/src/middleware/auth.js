/**
 * JWT authentication middleware.
 * Validates Bearer token and attaches decoded user payload to req.user.
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const { sendError } = require('../utils/apiResponse');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
}

module.exports = { authenticate };

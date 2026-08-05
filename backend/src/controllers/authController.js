/**
 * Auth controller — thin layer mapping HTTP requests to authService.
 */
const authService = require('../services/authService');
const { sendSuccess } = require('../utils/apiResponse');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };

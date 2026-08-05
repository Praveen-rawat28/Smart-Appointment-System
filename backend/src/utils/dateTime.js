/**
 * Date/time utilities for appointment validation.
 * All slot times are stored as ISO date strings (YYYY-MM-DD) and HH:MM (24h).
 */

/**
 * Combine date and time into a JavaScript Date in local timezone
 * @param {string} date - YYYY-MM-DD
 * @param {string} time - HH:MM
 * @returns {Date}
 */
function combineDateAndTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

/**
 * Check whether a slot start is in the past
 * @param {string} date
 * @param {string} startTime
 * @returns {boolean}
 */
function isInPast(date, startTime) {
  return combineDateAndTime(date, startTime) <= new Date();
}

/**
 * Return true if two time ranges on the same calendar day overlap
 * @param {string} startA - HH:MM
 * @param {string} endA - HH:MM
 * @param {string} startB - HH:MM
 * @param {string} endB - HH:MM
 * @returns {boolean}
 */
function timesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

/**
 * Check if cancellation is allowed given start datetime and window in hours
 * @param {string} date
 * @param {string} startTime
 * @param {number} windowHours
 * @returns {boolean}
 */
function isWithinCancellationWindow(date, startTime, windowHours) {
  const start = combineDateAndTime(date, startTime);
  const cutoff = new Date(start.getTime() - windowHours * 60 * 60 * 1000);
  return new Date() <= cutoff;
}

module.exports = {
  combineDateAndTime,
  isInPast,
  timesOverlap,
  isWithinCancellationWindow,
};

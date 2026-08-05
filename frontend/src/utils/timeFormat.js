/**
 * Time formatting utilities
 */

/**
 * Convert 24-hour time to 12-hour format with AM/PM
 * @param {string} time24 - Time in HH:MM format (24-hour)
 * @returns {string} Time in 12-hour format with AM/PM
 */
export function formatTime12Hour(time24) {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':').map(Number);
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Check if a date is a weekend
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {boolean} True if the date is a weekend
 */
export function isWeekend(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Get weekend error message
 * @returns {string} Error message for weekend selection
 */
export function getWeekendErrorMessage() {
  return 'Sorry, we cannot book appointments on weekends. Please select a weekday.';
}

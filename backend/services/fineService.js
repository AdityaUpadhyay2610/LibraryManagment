// backend/services/fineService.js
// Centralized calculation for library overdue days and late return fines.

const config = require('../config');

/**
 * Calculates overdue days and fine amount based on due date and return/current date.
 * Business Rule: ₹10 per day late (or FINE_PER_DAY from config).
 * @param {Date|string} dueDate - The date the book was due
 * @param {Date|string} [returnDate] - Date of return, defaults to current time
 * @returns {{ daysLate: number, fine: number }}
 */
function calculateFine(dueDate, returnDate = new Date()) {
  const due = new Date(dueDate).getTime();
  const returned = new Date(returnDate).getTime();

  // Difference in milliseconds
  const diffMs = returned - due;

  // Convert to full 24-hour days late
  const daysLate = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysLate > 0) {
    const fine = daysLate * config.FINE_PER_DAY;
    return {
      daysLate,
      fine: Number(fine.toFixed(2)),
    };
  }

  return {
    daysLate: 0,
    fine: 0.0,
  };
}

/**
 * Checks whether a due date has passed.
 * @param {Date|string} dueDate
 * @returns {boolean}
 */
function isOverdue(dueDate) {
  return new Date(dueDate).getTime() < Date.now();
}

module.exports = {
  calculateFine,
  isOverdue,
};

const config = require('../config');

function calculateFine(dueDate, returnDate = new Date()) {
  const due = new Date(dueDate).getTime();
  const returned = new Date(returnDate).getTime();

  const diffMs = returned - due;
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

function isOverdue(dueDate) {
  return new Date(dueDate).getTime() < Date.now();
}

module.exports = {
  calculateFine,
  isOverdue,
};

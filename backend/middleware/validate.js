// backend/middleware/validate.js
// Input validation middlewares for request bodies and parameters.
// Ensures uniform HTTP 400 responses with descriptive { message } on invalid input.

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates login request payload.
 */
function validateLogin(req, res, next) {
  const { username, password } = req.body || {};
  if (!username || typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ message: 'Username is required.' });
  }
  if (!password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ message: 'Password is required.' });
  }
  next();
}

/**
 * Validates admin registration request payload.
 */
function validateRegisterAdmin(req, res, next) {
  const { username, password, fullName } = req.body || {};
  if (!username || typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ message: 'Username is required.' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }
  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    return res.status(400).json({ message: 'Full name is required.' });
  }
  next();
}

/**
 * Validates adding a student payload.
 */
function validateAddStudent(req, res, next) {
  const { username, password, fullName, email } = req.body || {};
  if (!username || typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ message: 'Username is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }
  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    return res.status(400).json({ message: 'Full name is required.' });
  }
  if (email && !emailRegex.test(email.trim())) {
    return res.status(400).json({ message: 'Invalid email address format.' });
  }
  next();
}

/**
 * Validates adding or updating a book.
 */
function validateBook(req, res, next) {
  const { title, copies } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Book title is required' });
  }
  if (copies !== undefined && (isNaN(parseInt(copies, 10)) || parseInt(copies, 10) < 0)) {
    return res.status(400).json({ message: 'Copies must be a non-negative number.' });
  }
  next();
}

/**
 * Validates book issuing input.
 */
function validateIssueBook(req, res, next) {
  const { studentUsername, bookTitle, bookId } = req.body || {};
  if (!studentUsername || typeof studentUsername !== 'string' || !studentUsername.trim()) {
    return res.status(400).json({ message: 'Student username is required' });
  }
  if (!bookTitle && !bookId) {
    return res.status(400).json({ message: 'Book title or book ID is required' });
  }
  next();
}

/**
 * Validates change password payload.
 */
function validateChangePassword(req, res, next) {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || typeof oldPassword !== 'string') {
    return res.status(400).json({ message: 'Old password is required.' });
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
  }
  next();
}

/**
 * Middleware factory to validate that an ID parameter in the URL is a positive integer.
 * @param {string} paramName - e.g. 'id', 'transId', 'bookId'
 */
function validateNumericId(paramName) {
  return function (req, res, next) {
    const value = req.params[paramName];
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) {
      return res.status(400).json({
        message: `Invalid identifier: ${paramName} must be a positive integer.`
      });
    }
    next();
  };
}

module.exports = {
  validateLogin,
  validateRegisterAdmin,
  validateAddStudent,
  validateBook,
  validateIssueBook,
  validateChangePassword,
  validateNumericId,
};

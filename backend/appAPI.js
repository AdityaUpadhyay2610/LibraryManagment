const express = require('express');
const router = express.Router();

const asyncHandler = require('./utils/asyncHandler');
const uploadSpreadsheet = require('./middleware/upload');
const { requireLogin, requireRole } = require('./middleware/auth');
const { createLeakyBucket } = require('./middleware/leakyBucket');
const {
  validateLogin,
  validateRegisterAdmin,
  validateAddStudent,
  validateBook,
  validateIssueBook,
  validateChangePassword,
  validateNumericId,
} = require('./middleware/validate');

const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const studentController = require('./controllers/studentController');
const bookController = require('./controllers/bookController');

const { pool } = require('./db/pool');

// leaky bucket limiters for sensitive endpoints
const sensitiveLimiter = createLeakyBucket({ capacity: 5, leakRatePerSecond: 0.2 });
const emailActionLimiter = createLeakyBucket({ capacity: 10, leakRatePerSecond: 0.5 });

// health check
router.get('/health', asyncHandler(async (req, res) => {
  const dbCheck = await pool.query('SELECT 1 AS healthy');
  const isHealthy = dbCheck.rows.length > 0;

  return res.status(200).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    database: isHealthy ? 'CONNECTED' : 'DISCONNECTED',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}));

// auth routes
router.post('/auth/login', sensitiveLimiter, validateLogin, asyncHandler(authController.login));
router.post('/auth/register-admin', requireLogin, requireRole('ADMIN'), sensitiveLimiter, validateRegisterAdmin, asyncHandler(authController.registerAdmin));
router.get('/auth/me', asyncHandler(authController.getCurrentUser));
router.post('/auth/logout', authController.logout);
router.put('/auth/change-password', requireLogin, validateChangePassword, asyncHandler(authController.changePassword));
router.post('/auth/forgot-password', sensitiveLimiter, asyncHandler(authController.forgotPassword));
router.post('/auth/reset-password', sensitiveLimiter, asyncHandler(authController.resetPassword));

// books catalog
router.get('/books', asyncHandler(bookController.getBooks));
router.get('/books/categories', asyncHandler(bookController.getCategories));
router.get('/books/:id', validateNumericId('id'), asyncHandler(bookController.getBookById));

// admin routes
router.get('/admin/dashboard', requireLogin, requireRole('ADMIN'), asyncHandler(adminController.viewDashboard));
router.post('/admin/issue-book', requireLogin, requireRole('ADMIN'), emailActionLimiter, validateIssueBook, asyncHandler(adminController.issueBook));
router.post('/admin/return-book/:transId', requireLogin, requireRole('ADMIN'), validateNumericId('transId'), asyncHandler(adminController.returnBook));
router.get('/admin/students', requireLogin, requireRole('ADMIN'), asyncHandler(adminController.getStudents));
router.post('/admin/add-student', requireLogin, requireRole('ADMIN'), sensitiveLimiter, validateAddStudent, asyncHandler(adminController.addStudent));
router.put('/admin/students/:id', requireLogin, requireRole('ADMIN'), validateNumericId('id'), asyncHandler(adminController.editStudent));
router.post('/admin/students/:id/reset-password', requireLogin, requireRole('ADMIN'), validateNumericId('id'), asyncHandler(adminController.resetStudentPassword));
router.delete('/admin/students/:id', requireLogin, requireRole('ADMIN'), validateNumericId('id'), asyncHandler(adminController.deleteStudent));

// excel bulk import and templates
router.post('/admin/import/books', requireLogin, requireRole('ADMIN'), uploadSpreadsheet.single('file'), asyncHandler(adminController.importBooksExcel));
router.post('/admin/import/students', requireLogin, requireRole('ADMIN'), uploadSpreadsheet.single('file'), asyncHandler(adminController.importStudentsExcel));
router.get('/admin/templates/books.xlsx', requireLogin, requireRole('ADMIN'), adminController.downloadBooksTemplate);
router.get('/admin/templates/students.xlsx', requireLogin, requireRole('ADMIN'), adminController.downloadStudentsTemplate);

// book catalog management
router.post('/admin/add-book', requireLogin, requireRole('ADMIN'), validateBook, asyncHandler(adminController.addBook));
router.put('/admin/books/:id', requireLogin, requireRole('ADMIN'), validateNumericId('id'), validateBook, asyncHandler(adminController.editBook));
router.delete('/admin/delete-book/:id', requireLogin, requireRole('ADMIN'), validateNumericId('id'), asyncHandler(adminController.deleteBook));

// fines and reports
router.post('/admin/transactions/:id/pay-fine', requireLogin, requireRole('ADMIN'), validateNumericId('id'), asyncHandler(adminController.payFine));
router.get('/admin/overdue', requireLogin, requireRole('ADMIN'), asyncHandler(adminController.getOverdueReport));
router.get('/admin/stats', requireLogin, requireRole('ADMIN'), asyncHandler(adminController.getStatsReport));
router.get('/admin/transactions', requireLogin, requireRole('ADMIN'), asyncHandler(adminController.getTransactions));
router.get('/admin/export/transactions.csv', requireLogin, requireRole('ADMIN'), asyncHandler(adminController.exportTransactionsCsv));

// student routes
router.get('/student/dashboard', requireLogin, requireRole('STUDENT'), asyncHandler(studentController.dashboard));
router.post('/student/rent-book', requireLogin, requireRole('STUDENT'), asyncHandler(studentController.rentBook));
router.post('/student/return-book/:transId', requireLogin, requireRole('STUDENT'), validateNumericId('transId'), asyncHandler(studentController.returnBook));
router.post('/student/renew/:transId', requireLogin, requireRole('STUDENT'), validateNumericId('transId'), asyncHandler(studentController.renewBook));
router.post('/student/reserve/:bookId', requireLogin, requireRole('STUDENT'), validateNumericId('bookId'), asyncHandler(studentController.reserveBook));
router.delete('/student/reserve/:id', requireLogin, requireRole('STUDENT'), validateNumericId('id'), asyncHandler(studentController.cancelReservation));
router.get('/student/reservations', requireLogin, requireRole('STUDENT'), asyncHandler(studentController.getMyReservations));
router.get('/student/fines', requireLogin, requireRole('STUDENT'), asyncHandler(studentController.getMyFines));
router.get('/student/history', requireLogin, requireRole('STUDENT'), asyncHandler(studentController.getMyHistory));

module.exports = router;

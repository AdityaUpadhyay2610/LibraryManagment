// backend/middleware/upload.js
// Handles file uploads in-memory using multer for Excel and CSV imports.

const path = require('path');
const multer = require('multer');

// Configure in-memory storage (no temporary files stored on disk)
const storage = multer.memoryStorage();

// Accept Excel and CSV spreadsheets up to 15MB
const uploadSpreadsheet = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 Megabytes
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];

    if (
      allowedExtensions.includes(ext) ||
      file.mimetype.includes('excel') ||
      file.mimetype.includes('spreadsheet') ||
      file.mimetype.includes('csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.'));
    }
  },
});

module.exports = uploadSpreadsheet;

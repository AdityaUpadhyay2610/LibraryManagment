const path = require('path');
const multer = require('multer');

// in-memory storage, no temp files on disk
const storage = multer.memoryStorage();

const uploadSpreadsheet = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
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

const config = require('../config');

function notFoundHandler(req, res, next) {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

function errorHandler(err, req, res, next) {
  const timestamp = new Date().toISOString();
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[${timestamp}] ERROR ${statusCode} on ${req.method} ${req.originalUrl}:`, err.stack || err.message);

  const responsePayload = { message };
  if (config.NODE_ENV === 'development' && statusCode === 500) {
    responsePayload.debug = err.stack;
  }

  res.status(statusCode).json(responsePayload);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};

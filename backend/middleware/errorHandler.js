// backend/middleware/errorHandler.js
// Centralized error handling and 404 route handling for the Express server.

const config = require('../config');

/**
 * 404 Handler for undefined API routes.
 * Sends a structured JSON error response.
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

/**
 * Global Error Handler middleware.
 * Catches errors passed via next(err), logs with timestamp, and sends uniform JSON response.
 */
function errorHandler(err, req, res, next) {
  const timestamp = new Date().toISOString();
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error details on server terminal
  console.error(`[${timestamp}] ERROR ${statusCode} on ${req.method} ${req.originalUrl}:`, err.stack || err.message);

  // Send JSON response matching frontend expectations ({ message })
  const responsePayload = { message };

  // Only attach stack trace in development mode for debugging
  if (config.NODE_ENV === 'development' && statusCode === 500) {
    responsePayload.debug = err.stack;
  }

  res.status(statusCode).json(responsePayload);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};

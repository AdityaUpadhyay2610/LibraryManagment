// backend/utils/asyncHandler.js
// Wraps async route handlers to catch any rejected promises and forward them to Express next(error).
// This prevents unhandled promise rejections and keeps controller code clean without repetitive try/catch.

/**
 * Wraps an async Express middleware or controller function.
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware function
 */
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;

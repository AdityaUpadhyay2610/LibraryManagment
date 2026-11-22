// backend/middleware/auth.js
// Authentication and Authorization middleware for Express.
// Controls route access based on session status and user roles.

/**
 * Middleware: Requires the user to have an active logged-in session.
 * If not authenticated, returns 401 Unauthorized.
 */
function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({
    message: 'Unauthorized. Please login.'
  });
}

/**
 * Middleware Factory: Requires the logged-in user to have a specific role.
 * Example usage: requireRole('ADMIN') or requireRole('STUDENT')
 * Automatically checks both 'ADMIN' and 'ROLE_ADMIN' for compatibility.
 * @param {string} expectedRole - e.g. 'ADMIN' or 'STUDENT'
 */
function requireRole(expectedRole) {
  return function (req, res, next) {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        message: 'Unauthorized. Please login.'
      });
    }

    const userRole = (req.session.user.role || '').toUpperCase();
    const cleanExpected = expectedRole.toUpperCase();

    // Check if role matches (handles 'ADMIN' or 'ROLE_ADMIN')
    const isMatch = userRole === cleanExpected || userRole === `ROLE_${cleanExpected}`;

    if (!isMatch) {
      return res.status(403).json({
        message: 'Forbidden. You do not have permission to access this resource.'
      });
    }

    next();
  };
}

module.exports = {
  requireLogin,
  requireRole,
};

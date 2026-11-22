// check session cookie first, then bearer token header
function getAuthenticatedUser(req, callback) {
  if (req.session && req.session.user) {
    return callback(null, req.session.user);
  }

  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const sid = authHeader.substring(7).trim();
    if (sid && req.sessionStore) {
      return req.sessionStore.get(sid, (err, sess) => {
        if (!err && sess && sess.user) {
          req.session.user = sess.user;
          req.sessionID = sid;
          return callback(null, sess.user);
        }
        return callback(null, null);
      });
    }
  }

  return callback(null, null);
}

function requireLogin(req, res, next) {
  getAuthenticatedUser(req, (err, user) => {
    if (user) {
      return next();
    }
    return res.status(401).json({
      message: 'Unauthorized. Please login.'
    });
  });
}

function requireRole(expectedRole) {
  return function (req, res, next) {
    getAuthenticatedUser(req, (err, user) => {
      if (!user) {
        return res.status(401).json({
          message: 'Unauthorized. Please login.'
        });
      }

      const userRole = (user.role || '').toUpperCase();
      const cleanExpected = expectedRole.toUpperCase();
      const isMatch = userRole === cleanExpected || userRole === `ROLE_${cleanExpected}`;

      if (!isMatch) {
        return res.status(403).json({
          message: 'Forbidden. You do not have permission to access this resource.'
        });
      }

      next();
    });
  };
}

module.exports = {
  requireLogin,
  requireRole,
  getAuthenticatedUser,
};

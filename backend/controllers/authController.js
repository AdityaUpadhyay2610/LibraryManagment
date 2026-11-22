const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../db/pool');
const { recordFailedLogin, clearFailedLogin, checkLoginLockout } = require('../middleware/leakyBucket');
const emailService = require('../services/emailService');

function sanitizeUser(u) {
  return {
    id: u.id,
    username: u.username,
    fullName: u.full_name,
    role: u.role,
    branch: u.branch,
    year: u.academic_year,
    email: u.email,
  };
}

async function login(req, res) {
  const { username, password } = req.body;

  // lock out account if too many failed attempts
  const lockout = checkLoginLockout(username);
  if (lockout.isLocked) {
    return res.status(429).json({
      message: `Too many failed login attempts. Account temporarily locked. Please try again in ${lockout.retryAfterSeconds} seconds.`,
      retryAfterSeconds: lockout.retryAfterSeconds,
    });
  }

  const userResult = await pool.query(
    'SELECT * FROM app_user WHERE username = $1',
    [username]
  );

  if (userResult.rows.length === 0) {
    recordFailedLogin(username);
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const user = userResult.rows[0];

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    recordFailedLogin(username);
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  clearFailedLogin(username);

  const cleanUser = sanitizeUser(user);
  req.session.user = cleanUser;

  // cross-origin needs SameSite=None, otherwise Lax is fine
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && host && !origin.includes(host)) {
    req.session.cookie.sameSite = 'none';
    req.session.cookie.secure = true;
  } else {
    req.session.cookie.sameSite = 'lax';
  }

  req.session.save((err) => {
    if (err) {
      console.error('session save error:', err);
      return res.status(500).json({ message: 'Failed to create user session' });
    }
    return res.status(200).json({
      ...cleanUser,
      token: req.sessionID,
    });
  });
}

async function registerAdmin(req, res) {
  const { username, password, fullName, email } = req.body;

  const existing = await pool.query(
    'SELECT id FROM app_user WHERE username = $1',
    [username]
  );
  if (existing.rows.length > 0) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO app_user (username, password, role, full_name, branch, academic_year, email)
     VALUES ($1, $2, 'ROLE_ADMIN', $3, 'N/A', 'N/A', $4)`,
    [username, hashedPassword, fullName, email || null]
  );

  return res.status(200).json({ message: 'Admin registered successfully' });
}

async function getCurrentUser(req, res) {
  let sessionUser = req.session && req.session.user;

  // fallback to bearer token if browser blocked the cookie
  if (!sessionUser) {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const sid = authHeader.substring(7).trim();
      if (sid && req.sessionStore) {
        sessionUser = await new Promise((resolve) => {
          req.sessionStore.get(sid, (err, sess) => {
            if (!err && sess && sess.user) {
              req.session.user = sess.user;
              req.sessionID = sid;
              resolve(sess.user);
            } else {
              resolve(null);
            }
          });
        });
      }
    }
  }

  if (!sessionUser) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const result = await pool.query(
    'SELECT * FROM app_user WHERE id = $1',
    [sessionUser.id]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ message: 'User not found' });
  }

  const cleanUser = sanitizeUser(result.rows[0]);
  req.session.user = cleanUser;
  return res.status(200).json(cleanUser);
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logged out successfully' });
  });
}

async function changePassword(req, res) {
  const userId = req.session.user.id;
  const { oldPassword, newPassword } = req.body;

  const result = await pool.query('SELECT password FROM app_user WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isMatch = await bcrypt.compare(oldPassword, result.rows[0].password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Current password does not match.' });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE app_user SET password = $1 WHERE id = $2', [newHash, userId]);

  return res.status(200).json({ message: 'Password updated successfully' });
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  const result = await pool.query('SELECT * FROM app_user WHERE email = $1', [email.trim()]);
  if (result.rows.length === 0) {
    // don't reveal whether the email exists or not
    return res.status(200).json({ message: 'If that email is registered, a password reset code has been sent.' });
  }

  const user = result.rows[0];
  const resetToken = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

  await pool.query(
    'UPDATE app_user SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
    [resetToken, expires, user.id]
  );

  const subject = 'Library Management System - Password Reset Request';
  const body = `Hello ${user.full_name || user.username},\n\n` +
    `Use this token to reset your password:\n\n` +
    `Reset Token: ${resetToken}\n\n` +
    `This token will expire in 30 minutes.\n` +
    `If you did not request this, you can ignore this email.\n\n` +
    `Library Team`;

  await emailService.sendEmail(user.email, subject, body);

  return res.status(200).json({ message: 'If that email is registered, a password reset code has been sent.' });
}

async function resetPassword(req, res) {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'Valid token and new password (min 8 characters) are required.' });
  }

  const result = await pool.query(
    'SELECT * FROM app_user WHERE reset_token = $1 AND reset_token_expires > NOW()',
    [token]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
  }

  const user = result.rows[0];
  const newHash = await bcrypt.hash(newPassword, 10);

  await pool.query(
    'UPDATE app_user SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
    [newHash, user.id]
  );

  return res.status(200).json({ message: 'Password reset successfully. You can now login.' });
}

module.exports = {
  login,
  registerAdmin,
  getCurrentUser,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  sanitizeUser,
};

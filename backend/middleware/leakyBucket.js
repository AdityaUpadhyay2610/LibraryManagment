const config = require('../config');

function createLeakyBucket(options = {}) {
  const capacity = options.capacity || config.LEAKY_BUCKET_CAPACITY || 5;
  const leakRatePerSecond = options.leakRatePerSecond || config.LEAKY_BUCKET_LEAK_PER_SEC || 0.2;

  const clients = new Map();

  // clean up inactive clients every 5 mins
  setInterval(() => {
    const now = Date.now();
    for (const [key, state] of clients.entries()) {
      if (now - state.lastLeakTime > 15 * 60 * 1000) {
        clients.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return function leakyBucketMiddleware(req, res, next) {
    const clientKey = req.session && req.session.user && req.session.user.id
      ? `user_${req.session.user.id}`
      : `ip_${req.ip || req.connection.remoteAddress || 'unknown'}`;

    const now = Date.now();
    let state = clients.get(clientKey);

    if (!state) {
      state = {
        waterLevel: 0,
        lastLeakTime: now,
      };
      clients.set(clientKey, state);
    } else {
      // calculate how much leaked since last time
      const elapsedSeconds = (now - state.lastLeakTime) / 1000;
      const leakedAmount = elapsedSeconds * leakRatePerSecond;
      state.waterLevel = Math.max(0, state.waterLevel - leakedAmount);
      state.lastLeakTime = now;
    }

    if (state.waterLevel + 1 <= capacity) {
      state.waterLevel += 1;

      const remainingSpace = Math.max(0, Math.floor(capacity - state.waterLevel));
      res.setHeader('X-RateLimit-Limit', capacity);
      res.setHeader('X-RateLimit-Remaining', remainingSpace);

      return next();
    }

    // bucket full, return retry time
    const overflowAmount = (state.waterLevel + 1) - capacity;
    const retryAfterSeconds = Math.max(1, Math.ceil(overflowAmount / leakRatePerSecond));

    res.setHeader('Retry-After', retryAfterSeconds);
    return res.status(429).json({
      message: 'Too many sensitive requests. Please wait a moment before trying again.',
      retryAfterSeconds,
    });
  };
}

// failed login tracker for lockout
const failedLoginAttempts = new Map();

function recordFailedLogin(username) {
  if (!username) return;
  const key = username.toLowerCase().trim();
  const now = Date.now();
  const record = failedLoginAttempts.get(key) || { count: 0, lockedUntil: 0 };

  record.count += 1;
  // lock for 15 mins after 5 failed tries
  if (record.count >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000;
  }
  failedLoginAttempts.set(key, record);
}

function clearFailedLogin(username) {
  if (!username) return;
  const key = username.toLowerCase().trim();
  failedLoginAttempts.delete(key);
}

function checkLoginLockout(username) {
  if (!username) return { isLocked: false };
  const key = username.toLowerCase().trim();
  const record = failedLoginAttempts.get(key);
  if (!record) return { isLocked: false };

  const now = Date.now();
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLocked: true, retryAfterSeconds: remainingSeconds };
  }

  if (record.lockedUntil && now >= record.lockedUntil) {
    failedLoginAttempts.delete(key);
  }

  return { isLocked: false };
}

module.exports = {
  createLeakyBucket,
  recordFailedLogin,
  clearFailedLogin,
  checkLoginLockout,
};

const config = require('../config');

function createTokenBucket(options = {}) {
  const capacity = options.capacity || config.TOKEN_BUCKET_CAPACITY || 60;
  const refillPerSecond = options.refillPerSecond || config.TOKEN_BUCKET_REFILL_PER_SEC || 1;

  const clients = new Map();

  // clean up old clients after 10 mins
  setInterval(() => {
    const now = Date.now();
    for (const [key, state] of clients.entries()) {
      if (now - state.lastRefillTime > 10 * 60 * 1000) {
        clients.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return function tokenBucketMiddleware(req, res, next) {
    const clientKey = req.session && req.session.user && req.session.user.id
      ? `user_${req.session.user.id}`
      : `ip_${req.ip || req.connection.remoteAddress || 'unknown'}`;

    const now = Date.now();
    let state = clients.get(clientKey);

    if (!state) {
      state = {
        tokens: capacity,
        lastRefillTime: now,
      };
      clients.set(clientKey, state);
    } else {
      // refill tokens based on time passed
      const elapsedSeconds = (now - state.lastRefillTime) / 1000;
      const tokensToAdd = elapsedSeconds * refillPerSecond;
      state.tokens = Math.min(capacity, state.tokens + tokensToAdd);
      state.lastRefillTime = now;
    }

    if (state.tokens >= 1) {
      state.tokens -= 1;

      res.setHeader('X-RateLimit-Limit', capacity);
      res.setHeader('X-RateLimit-Remaining', Math.floor(state.tokens));

      return next();
    }

    const missingTokens = 1 - state.tokens;
    const retryAfterSeconds = Math.ceil(missingTokens / refillPerSecond);

    res.setHeader('Retry-After', retryAfterSeconds);
    return res.status(429).json({
      message: 'Too many requests. Please slow down and try again shortly.',
      retryAfterSeconds,
    });
  };
}

module.exports = createTokenBucket;

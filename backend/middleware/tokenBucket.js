// Token Bucket Rate Limiter
// Regulates API request rates, allowing brief burst capacity while refilling at a steady rate.

const config = require('../config');

/**
 * Creates an Express middleware for Token Bucket rate limiting.
 * @param {Object} options
 * @param {number} options.capacity - Maximum tokens the bucket can hold (default from config)
 * @param {number} options.refillPerSecond - How many tokens are added each second (default from config)
 */
function createTokenBucket(options = {}) {
  const capacity = options.capacity || config.TOKEN_BUCKET_CAPACITY || 60;
  const refillPerSecond = options.refillPerSecond || config.TOKEN_BUCKET_REFILL_PER_SEC || 1;

  // In-memory store: key -> { tokens, lastRefillTime }
  const clients = new Map();

  // Periodically clean up clients who haven't made requests in 10 minutes to save memory
  setInterval(() => {
    const now = Date.now();
    for (const [key, state] of clients.entries()) {
      if (now - state.lastRefillTime > 10 * 60 * 1000) {
        clients.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref(); // .unref() lets Node exit cleanly if this timer is active

  return function tokenBucketMiddleware(req, res, next) {
    // Unique identifier for client: authenticated user ID or remote IP address
    const clientKey = req.session && req.session.user && req.session.user.id
      ? `user_${req.session.user.id}`
      : `ip_${req.ip || req.connection.remoteAddress || 'unknown'}`;

    const now = Date.now();
    let state = clients.get(clientKey);

    if (!state) {
      // First visit: start with a full bucket
      state = {
        tokens: capacity,
        lastRefillTime: now,
      };
      clients.set(clientKey, state);
    } else {
      // Refill tokens lazily based on how many seconds passed since the last request
      const elapsedSeconds = (now - state.lastRefillTime) / 1000;
      const tokensToAdd = elapsedSeconds * refillPerSecond;
      state.tokens = Math.min(capacity, state.tokens + tokensToAdd);
      state.lastRefillTime = now;
    }

    // Check if we have at least 1 token to consume
    if (state.tokens >= 1) {
      state.tokens -= 1;

      // Set standard informational rate limit headers
      res.setHeader('X-RateLimit-Limit', capacity);
      res.setHeader('X-RateLimit-Remaining', Math.floor(state.tokens));

      return next();
    }

    // Bucket is empty: calculate how long until at least 1 token is available
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

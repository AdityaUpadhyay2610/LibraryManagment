const express = require('express');
const request = require('supertest');
const createTokenBucket = require('../middleware/tokenBucket');
const { createLeakyBucket, recordFailedLogin, checkLoginLockout, clearFailedLogin } = require('../middleware/leakyBucket');

describe('Rate Limiter Algorithms', () => {
  describe('Token Bucket Middleware', () => {
    let app;

    beforeEach(() => {
      app = express();
      // Configure bucket with capacity of 3, refilling 1 token every 10 seconds (slow refill for test)
      const testLimiter = createTokenBucket({ capacity: 3, refillPerSecond: 0.1 });

      app.use('/test-token', testLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });
    });

    it('allows requests within capacity and sets rate limit headers', async () => {
      const res1 = await request(app).get('/test-token');
      expect(res1.status).toBe(200);
      expect(res1.headers['x-ratelimit-limit']).toBe('3');
      expect(res1.headers['x-ratelimit-remaining']).toBe('2');

      const res2 = await request(app).get('/test-token');
      expect(res2.status).toBe(200);
      expect(res2.headers['x-ratelimit-remaining']).toBe('1');

      const res3 = await request(app).get('/test-token');
      expect(res3.status).toBe(200);
      expect(res3.headers['x-ratelimit-remaining']).toBe('0');
    });

    it('returns HTTP 429 with Retry-After when bucket is exhausted', async () => {
      // Consume all 3 tokens
      await request(app).get('/test-token');
      await request(app).get('/test-token');
      await request(app).get('/test-token');

      // 4th request must be rejected
      const res4 = await request(app).get('/test-token');
      expect(res4.status).toBe(429);
      expect(res4.body).toHaveProperty('message');
      expect(res4.body).toHaveProperty('retryAfterSeconds');
      expect(res4.headers['retry-after']).toBeDefined();
    });
  });

  describe('Leaky Bucket Middleware', () => {
    let app;

    beforeEach(() => {
      app = express();
      // Configure bucket with capacity of 2 units of water, leaking very slowly (0.01/sec)
      const testLimiter = createLeakyBucket({ capacity: 2, leakRatePerSecond: 0.01 });

      app.use('/test-leaky', testLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });
    });

    it('accepts requests up to capacity and sets remaining space', async () => {
      const res1 = await request(app).get('/test-leaky');
      expect(res1.status).toBe(200);
      expect(res1.headers['x-ratelimit-limit']).toBe('2');
      expect(res1.headers['x-ratelimit-remaining']).toBe('1');

      const res2 = await request(app).get('/test-leaky');
      expect(res2.status).toBe(200);
      expect(res2.headers['x-ratelimit-remaining']).toBe('0');
    });

    it('rejects when the leaky bucket overflows', async () => {
      await request(app).get('/test-leaky');
      await request(app).get('/test-leaky');

      const res3 = await request(app).get('/test-leaky');
      expect(res3.status).toBe(429);
      expect(res3.body).toHaveProperty('message');
      expect(res3.body).toHaveProperty('retryAfterSeconds');
      expect(res3.headers['retry-after']).toBeDefined();
    });
  });

  describe('Login Lockout Tracker', () => {
    const testUser = 'lockout_user_test';

    afterEach(() => {
      clearFailedLogin(testUser);
    });

    it('locks out a user after 5 failed attempts', () => {
      expect(checkLoginLockout(testUser).isLocked).toBe(false);

      // Record 4 failed attempts
      for (let i = 0; i < 4; i++) {
        recordFailedLogin(testUser);
      }
      expect(checkLoginLockout(testUser).isLocked).toBe(false);

      // 5th failed attempt triggers lockout
      recordFailedLogin(testUser);
      const status = checkLoginLockout(testUser);
      expect(status.isLocked).toBe(true);
      expect(status.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('clears lockout on successful login', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedLogin(testUser);
      }
      expect(checkLoginLockout(testUser).isLocked).toBe(true);

      clearFailedLogin(testUser);
      expect(checkLoginLockout(testUser).isLocked).toBe(false);
    });
  });
});

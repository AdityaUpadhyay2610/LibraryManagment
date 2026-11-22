const express = require('express');
const request = require('supertest');
const { requireLogin, requireRole } = require('../middleware/auth');
const { validateLogin, validateRegisterAdmin } = require('../middleware/validate');

describe('Authentication & Authorization Middlewares', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock session middleware helper
    app.use((req, res, next) => {
      // Simulate session based on headers if passed in test
      if (req.headers['x-mock-role']) {
        req.session = {
          user: {
            id: 1,
            username: req.headers['x-mock-username'] || 'testuser',
            role: req.headers['x-mock-role'],
          },
        };
      }
      next();
    });

    // Test routes
    app.get('/protected-login', requireLogin, (req, res) => {
      res.status(200).json({ success: true, user: req.session.user });
    });

    app.get('/admin-only', requireLogin, requireRole('ADMIN'), (req, res) => {
      res.status(200).json({ admin: true });
    });

    app.get('/student-only', requireLogin, requireRole('STUDENT'), (req, res) => {
      res.status(200).json({ student: true });
    });

    app.post('/validate-login-test', validateLogin, (req, res) => {
      res.status(200).json({ valid: true });
    });

    app.post('/validate-register-test', validateRegisterAdmin, (req, res) => {
      res.status(200).json({ valid: true });
    });
  });

  describe('requireLogin Middleware', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/protected-login');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized/i);
    });

    it('allows authenticated requests', async () => {
      const res = await request(app)
        .get('/protected-login')
        .set('x-mock-role', 'ROLE_STUDENT');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('requireRole Middleware', () => {
    it('allows user with matching ROLE_ADMIN', async () => {
      const res = await request(app)
        .get('/admin-only')
        .set('x-mock-role', 'ROLE_ADMIN');
      expect(res.status).toBe(200);
      expect(res.body.admin).toBe(true);
    });

    it('rejects student attempting to access admin route with 403', async () => {
      const res = await request(app)
        .get('/admin-only')
        .set('x-mock-role', 'ROLE_STUDENT');
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/forbidden/i);
    });

    it('allows student to access student route', async () => {
      const res = await request(app)
        .get('/student-only')
        .set('x-mock-role', 'ROLE_STUDENT');
      expect(res.status).toBe(200);
      expect(res.body.student).toBe(true);
    });
  });

  describe('Input Validation', () => {
    it('rejects login with missing username', async () => {
      const res = await request(app)
        .post('/validate-login-test')
        .send({ password: 'password123' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/username is required/i);
    });

    it('rejects registration with short password (< 8 chars)', async () => {
      const res = await request(app)
        .post('/validate-register-test')
        .send({ username: 'newadmin', password: '123', fullName: 'Admin Name' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/at least 8 characters/i);
    });
  });
});

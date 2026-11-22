// backend/server.js
// Application entry point. Configures Express middlewares, session, security,
// mounts API routes, starts background cron jobs, and handles graceful shutdown.

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

// Single centralized config
const config = require('./config');

// Shared Database Pool
const { pool } = require('./db/pool');

// API Routes and Error Handlers
const appAPI = require('./appAPI');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Rate Limiters & Scheduled Services
const createTokenBucket = require('./middleware/tokenBucket');
const notificationService = require('./services/notificationService');

const app = express();

// 1. Security HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Allows flexible integration with Vite frontend
}));

// 2. Cross-Origin Resource Sharing (CORS) configured for frontend
app.use(cors({
  origin: config.CLIENT_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Retry-After', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
}));

// 3. HTTP Request Logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 4. Request Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Persistent Session Storage via PostgreSQL (connect-pg-simple)
app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: 'lax',
      secure: config.NODE_ENV === 'production',
    },
  })
);

// 6. Global Token Bucket Rate Limiter on all /api endpoints (excluding /api/health)
const globalApiLimiter = createTokenBucket({
  capacity: config.TOKEN_BUCKET_CAPACITY,
  refillPerSecond: config.TOKEN_BUCKET_REFILL_PER_SEC,
});

app.use('/api', (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  return globalApiLimiter(req, res, next);
});

// 7. Mount all API routes under /api
app.use('/api', appAPI);

// 8. In production, serve the built React frontend static files
if (config.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 9. 404 Route Handler and Central Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

// 10. Start Server
let server = null;
if (config.NODE_ENV !== 'test') {
  server = app.listen(config.PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Library Management Server running on port ${config.PORT}`);
    console.log(`   Environment : ${config.NODE_ENV}`);
    console.log(`   Client URL  : ${config.CLIENT_ORIGIN}`);
    console.log(`   Healthcheck : http://localhost:${config.PORT}/api/health`);
    console.log(`======================================================\n`);

    // Start background notification scheduler
    notificationService.startScheduledJobs();
  });
}

// 11. Graceful Shutdown
function gracefulShutdown(signal) {
  console.log(`\n[SHUTDOWN] Received ${signal}. Closing server gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('[SHUTDOWN] HTTP server closed.');
      try {
        await pool.end();
        console.log('[SHUTDOWN] PostgreSQL database pool disconnected.');
      } catch (err) {
        console.error('[SHUTDOWN ERROR] Error while closing pool:', err.message);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;

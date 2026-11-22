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

// Trust reverse proxies (Render, Vercel, Railway, AWS ALB) for secure cookies & client IP
app.set('trust proxy', 1);

// 1. Security HTTP headers
app.use(helmet({
  contentSecurityPolicy: false,
}));

// 2. Cross-Origin Resource Sharing (CORS) configured for frontend & Vercel
const allowedOrigins = (config.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
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
    proxy: true,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: 'lax', // Use 'lax' by default: ensures Chrome, Safari & Edge always accept it on same-origin
      secure: config.NODE_ENV === 'production',
    },
  })
);

// Dynamic cookie adaptation: if request is truly cross-domain (e.g. Vercel -> Render), switch to SameSite=None
app.use((req, res, next) => {
  if (req.session && req.session.cookie) {
    const origin = req.headers.origin;
    const host = req.headers.host;
    if (origin && host && !origin.includes(host)) {
      req.session.cookie.sameSite = 'none';
      req.session.cookie.secure = true;
    } else {
      req.session.cookie.sameSite = 'lax';
    }
  }
  next();
});

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

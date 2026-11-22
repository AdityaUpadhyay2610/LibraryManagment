const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const config = require('./config');
const { pool } = require('./db/pool');
const appAPI = require('./appAPI');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const createTokenBucket = require('./middleware/tokenBucket');
const notificationService = require('./services/notificationService');

const app = express();

// trust reverse proxy for cookies & client ip
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
}));

// cors configuration
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

if (config.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// postgres session store
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
      sameSite: 'lax',
      secure: config.NODE_ENV === 'production',
    },
  })
);

// handle cross-domain cookies if front and back are on different domains
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

// rate limit /api endpoints
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

app.use('/api', appAPI);

// serve frontend in production
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

app.use(notFoundHandler);
app.use(errorHandler);

let server = null;
if (config.NODE_ENV !== 'test') {
  server = app.listen(config.PORT, () => {
    console.log(`Library management server running on port ${config.PORT}`);
    notificationService.startScheduledJobs();
  });
}

function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      try {
        await pool.end();
      } catch (err) {
        console.error('Error closing database pool:', err.message);
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

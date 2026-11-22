// backend/config.js
// Loads environment variables from .env file ONCE and exports them for the whole application.
// Hard rule: process.env is ONLY accessed in this file.

const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

/**
 * Helper function to safely read an environment variable with a default fallback.
 * @param {string} key - Name of the environment variable
 * @param {string|number} defaultValue - Fallback value if not set
 * @returns {string|number}
 */
function getEnv(key, defaultValue) {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value;
}

const config = {
  // Server port
  PORT: parseInt(getEnv('PORT', 8080), 10),

  // Application environment ('development' | 'production' | 'test')
  NODE_ENV: getEnv('NODE_ENV', 'development'),

  // Allowed frontend client URL for CORS
  CLIENT_ORIGIN: getEnv('CLIENT_ORIGIN', 'http://localhost:5173'),

  // PostgreSQL connection string
  DATABASE_URL: getEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/library_db'),

  // Secret key used to sign HTTP session cookies
  SESSION_SECRET: getEnv('SESSION_SECRET', 'library_management_secret_key_change_in_production'),

  // Email SMTP settings (Nodemailer)
  MAIL_USER: getEnv('MAIL_USER', ''),
  MAIL_PASS: getEnv('MAIL_PASS', ''),

  // Library Business Rules
  LOAN_DAYS: parseInt(getEnv('LOAN_DAYS', 7), 10),
  FINE_PER_DAY: parseFloat(getEnv('FINE_PER_DAY', 10)),
  MAX_BOOKS_PER_STUDENT: parseInt(getEnv('MAX_BOOKS_PER_STUDENT', 3), 10),

  // Token Bucket Rate Limiter settings (for general API burst & refilling)
  TOKEN_BUCKET_CAPACITY: parseInt(getEnv('TOKEN_BUCKET_CAPACITY', 60), 10),
  TOKEN_BUCKET_REFILL_PER_SEC: parseFloat(getEnv('TOKEN_BUCKET_REFILL_PER_SEC', 1)),

  // Leaky Bucket Rate Limiter settings (for sensitive endpoints like login/auth)
  LEAKY_BUCKET_CAPACITY: parseInt(getEnv('LEAKY_BUCKET_CAPACITY', 5), 10),
  LEAKY_BUCKET_LEAK_PER_SEC: parseFloat(getEnv('LEAKY_BUCKET_LEAK_PER_SEC', 0.2)),
};

// Validate critical configuration variables at startup
const requiredKeys = ['DATABASE_URL', 'SESSION_SECRET'];
for (const key of requiredKeys) {
  if (!config[key]) {
    console.error(`[CONFIG ERROR] Missing required environment variable: ${key}`);
    console.error(`Please check your .env file in the backend folder.`);
    process.exit(1);
  }
}

module.exports = config;

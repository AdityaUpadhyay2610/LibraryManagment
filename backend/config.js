const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

function getEnv(key, defaultValue) {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value;
}

const config = {
  PORT: parseInt(getEnv('PORT', 8080), 10),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  CLIENT_ORIGIN: getEnv('CLIENT_ORIGIN', 'http://localhost:5173'),
  DATABASE_URL: getEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/library_db'),
  SESSION_SECRET: getEnv('SESSION_SECRET', 'library_management_secret_key_change_in_production'),

  // email settings
  MAIL_USER: getEnv('MAIL_USER', ''),
  MAIL_PASS: getEnv('MAIL_PASS', ''),

  // library rules
  LOAN_DAYS: parseInt(getEnv('LOAN_DAYS', 7), 10),
  FINE_PER_DAY: parseFloat(getEnv('FINE_PER_DAY', 10)),
  MAX_BOOKS_PER_STUDENT: parseInt(getEnv('MAX_BOOKS_PER_STUDENT', 3), 10),

  // rate limiter settings
  TOKEN_BUCKET_CAPACITY: parseInt(getEnv('TOKEN_BUCKET_CAPACITY', 60), 10),
  TOKEN_BUCKET_REFILL_PER_SEC: parseFloat(getEnv('TOKEN_BUCKET_REFILL_PER_SEC', 1)),
  LEAKY_BUCKET_CAPACITY: parseInt(getEnv('LEAKY_BUCKET_CAPACITY', 5), 10),
  LEAKY_BUCKET_LEAK_PER_SEC: parseFloat(getEnv('LEAKY_BUCKET_LEAK_PER_SEC', 0.2)),
};

// verify critical env vars
const requiredKeys = ['DATABASE_URL', 'SESSION_SECRET'];
for (const key of requiredKeys) {
  if (!config[key]) {
    console.error(`[CONFIG ERROR] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

module.exports = config;

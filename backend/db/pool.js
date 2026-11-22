// backend/db/pool.js
// Provides a shared PostgreSQL connection pool for the entire application.

const { Pool } = require('pg');
const config = require('../config');

// Base connection pool configuration
const poolConfig = {
  connectionString: config.DATABASE_URL,
};

// Cloud databases like Neon Postgres (neon.tech) require SSL/TLS connections
const isNeon = config.DATABASE_URL.includes('neon.tech');
const requiresSsl = config.DATABASE_URL.includes('sslmode=require') || config.DATABASE_URL.includes('ssl=true');

if (isNeon || requiresSsl) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

// Initialize the pg Pool
const pool = new Pool(poolConfig);

// Log any unexpected pool errors
pool.on('error', (err) => {
  console.error('[DB POOL ERROR] Unexpected error on idle database client:', err.message);
});

module.exports = {
  pool,
  /**
   * Helper function to execute a parameterized SQL query directly.
   * @param {string} text - SQL query text with $1, $2 placeholders
   * @param {Array} params - Query parameter values
   */
  query: (text, params) => pool.query(text, params),
};

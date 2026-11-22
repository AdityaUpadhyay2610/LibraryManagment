const { Pool } = require('pg');
const config = require('../config');

const poolConfig = {
  connectionString: config.DATABASE_URL,
};

// neon requires ssl
const isNeon = config.DATABASE_URL.includes('neon.tech');
const requiresSsl = config.DATABASE_URL.includes('sslmode=require') || config.DATABASE_URL.includes('ssl=true');

if (isNeon || requiresSsl) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[DB POOL ERROR] unexpected error on idle client:', err.message);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};

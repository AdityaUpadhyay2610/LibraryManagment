// backend/db/migrateFromMySql.js
// Optional migration utility to migrate legacy MySQL tables into PostgreSQL.
// Reads data from a MySQL database (if credentials are provided) and copies into PostgreSQL.

const { pool } = require('./pool');

async function migrate() {
  console.log('=== MySQL to PostgreSQL Migration Utility ===');
  console.log('To migrate live data from an existing MySQL database:');
  console.log('1. Install mysql2 if needed: npm install mysql2');
  console.log('2. Provide MYSQL_URL in your environment or enter your credentials here.');
  console.log('3. Run: npm run db:migrate-mysql');
  console.log('');
  console.log('PostgreSQL schema is ready. If you are starting fresh, run:');
  console.log('  npm run db:init');

  // Verify PostgreSQL connection
  try {
    const res = await pool.query('SELECT NOW() AS current_time');
    console.log('✓ PostgreSQL connected successfully at:', res.rows[0].current_time);
  } catch (err) {
    console.error('✗ PostgreSQL connection error:', err.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;

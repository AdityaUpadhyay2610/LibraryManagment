const { pool } = require('./pool');

async function migrate() {
  console.log('MySQL to PostgreSQL migration helper');
  console.log('To migrate live data from MySQL:');
  console.log('1. Install mysql2 if needed: npm install mysql2');
  console.log('2. Provide MYSQL_URL in your environment or enter credentials');
  console.log('3. Run: npm run db:migrate-mysql\n');
  console.log('If starting fresh, run: npm run db:init');

  try {
    const res = await pool.query('SELECT NOW() AS current_time');
    console.log('Connected to PostgreSQL at:', res.rows[0].current_time);
  } catch (err) {
    console.error('PostgreSQL connection error:', err.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;

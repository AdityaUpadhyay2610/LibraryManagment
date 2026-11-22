const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./pool');

async function runSeed() {
  const client = await pool.connect();
  try {
    console.log('Checking database connection and schema...');
    
    // read and apply schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('Schema ready');

    // check if admin user exists
    const checkUser = await client.query(
      'SELECT id FROM app_user WHERE username = $1',
      ['admin_user']
    );

    if (checkUser.rows.length === 0) {
      console.log('Seeding initial data...');

      // default admin
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      await client.query(
        `INSERT INTO app_user (username, password, role, full_name, branch, academic_year, email)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['admin_user', adminPasswordHash, 'ROLE_ADMIN', 'Administrator', 'N/A', 'N/A', 'admin@library.com']
      );
      console.log('Created admin: admin_user / admin123');

      // default student
      const studentPasswordHash = await bcrypt.hash('rahul123', 10);
      await client.query(
        `INSERT INTO app_user (username, password, role, full_name, branch, academic_year, email)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['student_rahul', studentPasswordHash, 'ROLE_STUDENT', 'Rahul Sharma', 'CSE', '3rd Year', 'rahul@student.edu']
      );
      console.log('Created student: student_rahul / rahul123');

      // sample books
      await client.query(
        `INSERT INTO book (title, author, isbn, category, copies, total_copies, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'Java Programming',
          'James Gosling',
          '978-0134685991',
          'Computer Science',
          5,
          5,
          'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=300&q=80'
        ]
      );

      await client.query(
        `INSERT INTO book (title, author, isbn, category, copies, total_copies, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'Spring Boot in Action',
          'Craig Walls',
          '978-1617292545',
          'Software Engineering',
          2,
          2,
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80'
        ]
      );
      console.log('Added initial books');
      console.log('Initial seed complete');
    } else {
      console.log('Database already has data. Skipping seed.');
    }
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runSeed();
}

module.exports = runSeed;

const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '6543'),
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAdmins() {
  try {
    const res = await pool.query('SELECT * FROM municipal_admins');
    console.log('Admins found:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkAdmins();

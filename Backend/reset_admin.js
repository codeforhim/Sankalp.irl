const { Pool } = require('pg');
const bcrypt = require('bcrypt');
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

async function resetAdmin() {
  try {
    const email = 'admin@city.gov.in';
    const password = 'password';
    const hash = await bcrypt.hash(password, 10);
    
    // Check if exists
    const admin = await pool.query('SELECT id FROM municipal_admins WHERE gov_email = $1', [email]);
    if (admin.rows.length === 0) {
      console.log('Admin not found, creating...');
      await pool.query('INSERT INTO municipal_admins (gov_email, password_hash, city_id) VALUES ($1, $2, $3)', [email, hash, 2]);
    } else {
      console.log('Admin found, updating...');
      await pool.query('UPDATE municipal_admins SET password_hash = $1 WHERE gov_email = $2', [hash, email]);
    }
    console.log('Admin Reset Complete: admin@city.gov.in / password');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

resetAdmin();

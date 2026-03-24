const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

async function del() {
    try {
        console.log("Deleting extra Ward 37 for Delhi...");
        const res = await pool.query(`
            DELETE FROM wards 
            WHERE city_id = (SELECT id FROM cities WHERE city_name = 'Delhi' LIMIT 1)
            AND id = 37;
        `);
        console.log(`Deleted ${res.rowCount} rows.`);
    } catch (err) {
        console.error("Delete failed:", err.message);
    } finally {
        await pool.end();
    }
}
del();

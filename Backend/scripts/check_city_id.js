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

async function check() {
    try {
        const res = await pool.query(`
            SELECT DISTINCT city_id FROM wards 
            WHERE city_id = (SELECT id FROM cities WHERE city_name = 'Delhi' LIMIT 1);
        `);
        const cityIdRes = await pool.query("SELECT id FROM cities WHERE city_name = 'Delhi'");
        console.log("Delhi City ID:", cityIdRes.rows[0]?.id);
        console.log("Distinct city_ids in wards table for Delhi:", res.rows.map(r => r.city_id));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
check();

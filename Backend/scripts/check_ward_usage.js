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
            SELECT id, ward_number, ward_name, 
            (SELECT COUNT(*) FROM ward_staff WHERE ward_id = wards.id) as staff_count,
            (SELECT COUNT(*) FROM complaints WHERE ward_id = wards.id) as complaint_count
            FROM wards 
            WHERE city_id = (SELECT id FROM cities WHERE city_name = 'Delhi' LIMIT 1)
            ORDER BY id;
        `);
        res.rows.forEach(r => {
            console.log(`ID: ${r.id}, Num: ${r.ward_number}, Staff: ${r.staff_count}, Complaints: ${r.complaint_count}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
check();

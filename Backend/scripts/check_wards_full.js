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
            SELECT id, ward_number, ward_name, ST_AsText(polygon_geometry) as geom
            FROM wards 
            WHERE city_id = (SELECT id FROM cities WHERE city_name = 'Delhi' LIMIT 1)
            ORDER BY id;
        `);
        console.log("Total Delhi Wards Row Count:", res.rows.length);
        res.rows.forEach(r => {
            console.log(`ID: ${r.id} | Num: ${r.ward_number} | Name: ${r.ward_name} | Geom: ${!!r.geom}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
check();

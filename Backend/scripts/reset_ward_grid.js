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

async function reset() {
    try {
        console.log("Resetting Delhi wards...");
        const delhiRes = await pool.query("SELECT id FROM cities WHERE city_name = 'Delhi'");
        const delhiId = delhiRes.rows[0]?.id;
        
        if (!delhiId) throw new Error("Delhi not found");

        // 1. Delete all existing wards for Delhi
        await pool.query("DELETE FROM wards WHERE city_id = $1", [delhiId]);
        console.log("Deleted old wards.");

        // 2. Insert exactly 36 wards
        for (let i = 1; i <= 36; i++) {
            await pool.query(
                "INSERT INTO wards (city_id, ward_number, ward_name) VALUES ($1, $2, $3)",
                [delhiId, i.toString(), `Ward ${i}`]
            );
        }
        console.log("Inserted 36 fresh wards.");

        // 3. Generate Grid (reusing the logic)
        const minLat = 28.40;
        const maxLat = 28.88;
        const minLng = 76.84;
        const maxLng = 77.34;
        const latStep = (maxLat - minLat) / 6;
        const lngStep = (maxLng - minLng) / 6;

        let wardCounter = 1;
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                const wMinLat = minLat + (i * latStep);
                const wMaxLat = wMinLat + latStep;
                const wMinLng = minLng + (j * lngStep);
                const wMaxLng = wMinLng + lngStep;
                const wkt = `POLYGON((${wMinLng} ${wMinLat}, ${wMaxLng} ${wMinLat}, ${wMaxLng} ${wMaxLat}, ${wMinLng} ${wMaxLat}, ${wMinLng} ${wMinLat}))`;
                
                await pool.query(
                    `UPDATE wards SET polygon_geometry = ST_GeomFromText($1, 4326) 
                     WHERE city_id = $2 AND ward_number = $3`,
                    [wkt, delhiId, wardCounter.toString()]
                );
                wardCounter++;
            }
        }
        console.log("Grid regenerated for exactly 36 wards.");
    } catch (err) {
        console.error("Reset failed:", err.message);
    } finally {
        await pool.end();
    }
}
reset();

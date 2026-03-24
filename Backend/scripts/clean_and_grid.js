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

async function clean() {
    try {
        console.log("Cleaning Delhi wards...");
        // 1. Find all Delhi wards
        const res = await pool.query("SELECT id FROM wards WHERE city_id = 2 ORDER BY id");
        console.log(`Found ${res.rows.length} wards for Delhi.`);

        // 1.5 Temporarily set all ward numbers to NULL or temp to avoid unique constraint
        await pool.query("UPDATE wards SET ward_number = id::TEXT || '_temp' WHERE city_id = 2");
        console.log("Temporarily re-named wards to avoid conflicts.");

        // 2. Re-number and re-name them 1 to 36 (limit to 36)
        for (let i = 0; i < Math.min(res.rows.length, 36); i++) {
            const wardId = res.rows[i].id;
            const newNum = (i + 1).toString();
            const newName = `Ward ${newNum}`;
            await pool.query(
                "UPDATE wards SET ward_number = $1, ward_name = $2, polygon_geometry = NULL WHERE id = $3",
                [newNum, newName, wardId]
            );
        }
        
        // Delete any extra wards for Delhi (above 36)
        if (res.rows.length > 36) {
            const extraIds = res.rows.slice(36).map(r => r.id);
            await pool.query("DELETE FROM wards WHERE id = ANY($1)", [extraIds]);
            console.log(`Deleted ${extraIds.length} extra wards.`);
        }

        console.log("Wards cleaned. Re-running grid generation...");

        // 3. Grid Generation
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
                     WHERE city_id = 2 AND ward_number = $2`,
                    [wkt, wardCounter.toString()]
                );
                wardCounter++;
            }
        }
        console.log("Done! Exactly 36 wards with grid geometries.");
    } catch (err) {
        console.error("Cleanup failed:", err.message);
    } finally {
        await pool.end();
    }
}
clean();

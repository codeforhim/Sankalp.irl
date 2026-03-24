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

async function generateGrid() {
    try {
        console.log("Generating 6x6 grid for Delhi wards...");
        
        // Approx Delhi Bounds for the 36-ward model
        const minLat = 28.40;
        const maxLat = 28.88;
        const minLng = 76.84;
        const maxLng = 77.34;
        
        const latStep = (maxLat - minLat) / 6;
        const lngStep = (maxLng - minLng) / 6;
        
        const delhiRes = await pool.query("SELECT id FROM cities WHERE city_name = 'Delhi'");
        const delhiId = delhiRes.rows[0]?.id;
        
        if (!delhiId) {
            console.error("Delhi city not found in database.");
            return;
        }

        let wardCounter = 1;
        for (let i = 0; i < 6; i++) { // rows (lat)
            for (let j = 0; j < 6; j++) { // cols (lng)
                const wMinLat = minLat + (i * latStep);
                const wMaxLat = wMinLat + latStep;
                const wMinLng = minLng + (j * lngStep);
                const wMaxLng = wMinLng + lngStep;
                
                // Create WKT Polygon
                const wkt = `POLYGON((${wMinLng} ${wMinLat}, ${wMaxLng} ${wMinLat}, ${wMaxLng} ${wMaxLat}, ${wMinLng} ${wMaxLat}, ${wMinLng} ${wMinLat}))`;
                
                await pool.query(
                    `UPDATE wards 
                     SET polygon_geometry = ST_GeomFromText($1, 4326) 
                     WHERE city_id = $2 AND ward_number = $3`,
                    [wkt, delhiId, wardCounter.toString()]
                );
                
                process.stdout.write(`.`);
                wardCounter++;
            }
        }
        
        console.log("\nGrid generation completed successfully!");
    } catch (err) {
        console.error("\nGrid generation failed:", err.message);
    } finally {
        await pool.end();
    }
}

generateGrid();

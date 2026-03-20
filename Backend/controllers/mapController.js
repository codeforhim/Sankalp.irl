const db = require('../config/db');
const wardService = require('../services/wardService');

const getMapDataByCity = async (req, res) => {
    try {
        const { city_id } = req.params;

        // Fetch just the coordinates and status for the Leaflet frontend map
        const query = `
            SELECT id, latitude, longitude, status, issue_type
            FROM complaints
            WHERE city_id = $1
        `;

        const mapData = await db.query(query, [city_id]);

        res.json(mapData.rows);
    } catch (error) {
        console.error('Error fetching map data:', error);
        res.status(500).json({ message: 'Server error retrieving map data' });
    }
};

const getWardGeometries = async (req, res) => {
    try {
        const { city_id } = req.params;
        const geometries = await wardService.getAllWardGeometries(city_id);
        res.json(geometries);
    } catch (error) {
        console.error('Error fetching ward geometries:', error);
        res.status(500).json({ message: 'Server error retrieving ward geometries' });
    }
};

const getHeatmapData = async (req, res) => {
    try {
        const { target_type, target_id } = req.params;
        // target_type: 'city' or 'ward'

        let query = `
            SELECT latitude, longitude,
            CASE 
                WHEN status = 'reported' THEN 1.0
                WHEN status = 'in_progress' THEN 0.8
                WHEN status = 'flagged_for_review' THEN 0.5
                ELSE 0.2 -- resolved
            END as intensity
            FROM complaints
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        `;
        const queryParams = [];

        if (target_type === 'city') {
            query += ` AND city_id = $1`;
            queryParams.push(target_id);
        } else if (target_type === 'ward') {
            query += ` AND ward_id = $1`;
            queryParams.push(target_id);
        }

        const mapData = await db.query(query, queryParams);

        // Return array of [lat, lng, intensity] for leaflet.heat
        const heatPoints = mapData.rows.map(row => [
            parseFloat(row.latitude),
            parseFloat(row.longitude),
            parseFloat(row.intensity) || 0.5
        ]);

        res.json(heatPoints);
    } catch (error) {
        console.error('Error fetching heatmap data:', error);
        res.status(500).json({ message: 'Server error retrieving heatmap data' });
    }
};

module.exports = {
    getMapDataByCity,
    getWardGeometries,
    getHeatmapData
};

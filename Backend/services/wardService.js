const db = require('../config/db');

/**
 * Spatial lookup to find which ward polygon contains the given coordinates.
 * PostGIS uses Longitude (X), Latitude (Y)
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<{id: number, name: string}|null>} ward_id and name or null if outside all bounds
 */
const findWardByCoordinates = async (latitude, longitude) => {
    try {
        const query = `
            SELECT id, ward_name AS name
            FROM wards
            WHERE ST_Contains(polygon_geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
            AND city_id = 2
            LIMIT 1;
        `;
        
        // Note: ST_MakePoint takes (longitude, latitude)
        const result = await db.query(query, [parseFloat(longitude), parseFloat(latitude)]);
        
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in findWardByCoordinates:', error);
        throw error;
    }
};

/**
 * Retrieves the GeoJSON geometry for all wards in a city,
 * along with some basic metadata for frontend rendering.
 * @param {number} city_id 
 * @returns {Promise<Object>} FeatureCollection GeoJSON
 */
const getAllWardGeometries = async (city_id) => {
    try {
        const query = `
            SELECT 
                id, 
                ward_name AS name,
                ST_AsGeoJSON(polygon_geometry)::json AS geometry
            FROM wards
            WHERE city_id = $1 AND polygon_geometry IS NOT NULL
        `;
        
        const result = await db.query(query, [city_id]);
        
        // Format as a proper GeoJSON FeatureCollection
        const features = result.rows.map(row => ({
            type: 'Feature',
            properties: {
                ward_id: row.id,
                name: row.name
            },
            geometry: row.geometry
        }));

        return {
            type: 'FeatureCollection',
            features
        };
    } catch (error) {
        console.error('Error in getAllWardGeometries:', error);
        throw error;
    }
};

/**
 * Retrieves the GeoJSON geometry and bounding box for a single ward.
 * Useful for auto-zooming the Ward Officer dashboard.
 * @param {number} ward_id 
 */
const getWardGeometry = async (ward_id) => {
    try {
        const query = `
            SELECT 
                id, 
                ward_name AS name,
                ST_AsGeoJSON(polygon_geometry)::json AS geometry,
                ST_Extent(polygon_geometry) as bbox_wkt
            FROM wards
            WHERE id = $1 AND polygon_geometry IS NOT NULL
            GROUP BY id, ward_name, polygon_geometry
        `;
        
        const result = await db.query(query, [ward_id]);
        
        if (result.rows.length === 0) return null;
        
        const row = result.rows[0];
        
        // Parse PostGIS ST_Extent output: "BOX(xmin ymin, xmax ymax)"
        // to a format Leaflet can use: [[ymin, xmin], [ymax, xmax]]
        let bounds = null;
        if (row.bbox_wkt) {
            const match = row.bbox_wkt.match(/BOX\(([^ ]+) ([^,]+),([^ ]+) ([^)]+)\)/);
            if (match) {
                const xmin = parseFloat(match[1]);
                const ymin = parseFloat(match[2]);
                const xmax = parseFloat(match[3]);
                const ymax = parseFloat(match[4]);
                bounds = [[ymin, xmin], [ymax, xmax]];
            }
        }
        
        return {
            type: 'Feature',
            properties: {
                ward_id: row.id,
                name: row.name,
                bounds
            },
            geometry: row.geometry
        };
    } catch (error) {
        console.error('Error in getWardGeometry:', error);
        throw error;
    }
};

module.exports = {
    findWardByCoordinates,
    getAllWardGeometries,
    getWardGeometry
};

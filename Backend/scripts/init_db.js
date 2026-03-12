import pool from '../config/db.js';

const initDB = async () => {
    try {
        // Enable PostGIS
        await pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');

        // Create cities table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cities (
                id SERIAL PRIMARY KEY,
                city_name VARCHAR(255) NOT NULL,
                state VARCHAR(255) NOT NULL,
                total_wards INT NOT NULL DEFAULT 0
            );
        `);

        // Create wards table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS wards (
                id SERIAL PRIMARY KEY,
                city_id INT REFERENCES cities(id) ON DELETE CASCADE,
                ward_number INT NOT NULL,
                ward_name VARCHAR(255) NOT NULL,
                polygon_geometry geometry(Polygon, 4326) NOT NULL
            );
        `);

        // Create civic_bodies table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS civic_bodies (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE
            );
        `);

        // Insert default civic bodies
        await pool.query(`
            INSERT INTO civic_bodies (id, name)
            VALUES 
                (1, 'Public Works Department (PWD)'),
                (2, 'Water Works Department'),
                (3, 'Sanitation Department'),
                (4, 'Electricity Department'),
                (5, 'Urban Planning Authority')
            ON CONFLICT (id) DO NOTHING;
        `);

        // Insert sample Indian cities
        await pool.query(`
            INSERT INTO cities (id, city_name, state, total_wards)
            VALUES 
                (1, 'Mumbai', 'Maharashtra', 24),
                (2, 'Delhi', 'Delhi', 272),
                (3, 'Bangalore', 'Karnataka', 198)
            ON CONFLICT (id) DO NOTHING;
        `);

        // Insert sample wards (simplified polygons for demo)
        await pool.query(`
            INSERT INTO wards (id, city_id, ward_number, ward_name, polygon_geometry)
            VALUES 
                (1, 1, 1, 'Colaba', ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[72.81,18.90],[72.83,18.90],[72.83,18.92],[72.81,18.92],[72.81,18.90]]]}')),
                (2, 1, 2, 'Bandra', ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[72.82,19.05],[72.85,19.05],[72.85,19.07],[72.82,19.07],[72.82,19.05]]]}')),
                (3, 2, 1, 'Connaught Place', ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.21,28.62],[77.23,28.62],[77.23,28.64],[77.21,28.64],[77.21,28.62]]]}')),
                (4, 3, 1, 'Koramangala', ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.61,12.92],[77.63,12.92],[77.63,12.94],[77.61,12.94],[77.61,12.92]]]}'))
            ON CONFLICT (id) DO NOTHING;
        `);

        // Create municipal_admins table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS municipal_admins (
                id SERIAL PRIMARY KEY,
                gov_email VARCHAR(255) UNIQUE NOT NULL CHECK (gov_email LIKE '%.gov.in'),
                password_hash VARCHAR(255) NOT NULL,
                city_id INT REFERENCES cities(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create ward_staff table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ward_staff (
                id SERIAL PRIMARY KEY,
                gov_email VARCHAR(255) UNIQUE NOT NULL CHECK (gov_email LIKE '%.gov.in'),
                password_hash VARCHAR(255) NOT NULL,
                city_id INT REFERENCES cities(id) ON DELETE CASCADE,
                ward_id INT REFERENCES wards(id) ON DELETE CASCADE,
                civic_body_id INT REFERENCES civic_bodies(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(ward_id, civic_body_id) -- One login per civic department per ward
            );
        `);

        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                trust_score INT DEFAULT 100,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create complaints table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS complaints (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                city_id INT REFERENCES cities(id) ON DELETE SET NULL,
                ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
                civic_body_id INT REFERENCES civic_bodies(id) ON DELETE SET NULL,
                text_input TEXT NOT NULL,
                audio_url VARCHAR(500),
                image_url VARCHAR(500),
                issue_type VARCHAR(255),
                priority_score INT DEFAULT 0,
                latitude DOUBLE PRECISION NOT NULL,
                longitude DOUBLE PRECISION NOT NULL,
                status VARCHAR(50) DEFAULT 'reported' CHECK (status IN ('reported', 'assigned', 'in_progress', 'resolved', 'verified')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Database initialized successfully!");
        process.exit(0);

    } catch (error) {
        console.error("Error initializing database:", error);
        process.exit(1);
    }
};

initDB();

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Cities Table
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    city_name VARCHAR(255) NOT NULL UNIQUE,
    state VARCHAR(255) NOT NULL,
    total_wards INTEGER NOT NULL DEFAULT 0
);

-- Insert major Indian Cities
INSERT INTO cities (city_name, state, total_wards) VALUES
    ('Mumbai', 'Maharashtra', 227),
    ('Delhi', 'Delhi', 250),
    ('Bangalore', 'Karnataka', 198),
    ('Chennai', 'Tamil Nadu', 200),
    ('Kolkata', 'West Bengal', 144)
ON CONFLICT (city_name) DO NOTHING;

-- 2. Wards Table (with Geospatial boundaries)
-- Note: polygon_geometry uses SRID 4326 (WGS 84 - Standard GPS coordinates)
CREATE TABLE IF NOT EXISTS wards (
    id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
    ward_number VARCHAR(50) NOT NULL,
    ward_name VARCHAR(255) NOT NULL,
    polygon_geometry GEOMETRY(Polygon, 4326) NOT NULL,
    UNIQUE(city_id, ward_number)
);

-- Insert Dummy Ward for Testing routing (Delhi test polygon)
-- This polygon represents a small box
INSERT INTO wards (city_id, ward_number, ward_name, polygon_geometry) 
SELECT id, 'W1', 'Test Ward Central', ST_GeomFromText('POLYGON((77.20 28.60, 77.25 28.60, 77.25 28.65, 77.20 28.65, 77.20 28.60))', 4326)
FROM cities WHERE city_name = 'Delhi'
ON CONFLICT DO NOTHING;

-- 3. Civic Bodies Table
CREATE TABLE IF NOT EXISTS civic_bodies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Prepopulate Civic Bodies
INSERT INTO civic_bodies (name) VALUES
    ('Public Works Department (PWD)'),
    ('Water Works Department'),
    ('Sanitation Department'),
    ('Electricity Department'),
    ('Urban Planning Authority')
ON CONFLICT (name) DO NOTHING;

-- 4. Municipal Admins Table
CREATE TABLE IF NOT EXISTS municipal_admins (
    id SERIAL PRIMARY KEY,
    gov_email VARCHAR(255) UNIQUE NOT NULL CHECK (gov_email LIKE '%.gov.in'),
    password_hash VARCHAR(255) NOT NULL,
    city_id INTEGER REFERENCES cities(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ward Staff Table
CREATE TABLE IF NOT EXISTS ward_staff (
    id SERIAL PRIMARY KEY,
    gov_email VARCHAR(255) UNIQUE NOT NULL CHECK (gov_email LIKE '%.gov.in'),
    password_hash VARCHAR(255) NOT NULL,
    city_id INTEGER REFERENCES cities(id) ON DELETE RESTRICT,
    ward_id INTEGER REFERENCES wards(id) ON DELETE RESTRICT,
    civic_body_id INTEGER REFERENCES civic_bodies(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ward_id, civic_body_id) -- One login per civic department per ward
);

-- 6. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    trust_score INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    city_id INTEGER REFERENCES cities(id) ON DELETE RESTRICT,
    ward_id INTEGER REFERENCES wards(id) ON DELETE RESTRICT,
    civic_body_id INTEGER REFERENCES civic_bodies(id) ON DELETE RESTRICT,
    
    text_input TEXT NOT NULL,
    audio_url VARCHAR(512),
    image_url VARCHAR(512),
    after_image_url VARCHAR(512),
    
    issue_type VARCHAR(100) NOT NULL,
    priority_score INTEGER DEFAULT 0,
    
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'reported' CHECK (status IN ('reported', 'assigned', 'in_progress', 'resolved', 'verified', 'flagged_for_review')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

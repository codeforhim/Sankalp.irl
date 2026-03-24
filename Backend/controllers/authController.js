const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const wardService = require('../services/wardService');
require('dotenv').config();

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

const registerAdmin = async (req, res) => {
    try {
        const { gov_email, password, city_id } = req.body;

        if (!gov_email.endsWith('.gov.in')) {
            return res.status(400).json({ message: 'Email must end with .gov.in' });
        }

        const existingAdmin = await db.query('SELECT id FROM municipal_admins WHERE gov_email = $1', [gov_email]);
        if (existingAdmin.rows.length > 0) {
            return res.status(400).json({ message: 'Admin already exists with this email' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const newAdmin = await db.query(
            'INSERT INTO municipal_admins (gov_email, password_hash, city_id) VALUES ($1, $2, $3) RETURNING id, gov_email, city_id',
            [gov_email, password_hash, city_id]
        );

        res.status(201).json({ message: 'Admin registered successfully', admin: newAdmin.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

const loginAdmin = async (req, res) => {
    try {
        const { gov_email, password } = req.body;

        const adminQuery = await db.query('SELECT * FROM municipal_admins WHERE gov_email = $1', [gov_email]);
        if (adminQuery.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const admin = adminQuery.rows[0];
        const validPassword = await bcrypt.compare(password, admin.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken({ id: admin.id, role: 'admin', city_id: admin.city_id });
        res.json({ token, admin: { id: admin.id, gov_email: admin.gov_email, city_id: admin.city_id } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const registerWardStaff = async (req, res) => {
    try {
        const { gov_email, password, city_id, ward_id, civic_body_id } = req.body;

        if (!gov_email.endsWith('.gov.in')) {
            return res.status(400).json({ message: 'Email must end with .gov.in' });
        }

        // Check unique constraint manually for better error message
        const existingStaff = await db.query('SELECT id FROM ward_staff WHERE ward_id = $1 AND civic_body_id = $2', [ward_id, civic_body_id]);
        if (existingStaff.rows.length > 0) {
            return res.status(400).json({ message: 'A staff member is already assigned to this ward and civic department' });
        }

        const existingEmail = await db.query('SELECT id FROM ward_staff WHERE gov_email = $1', [gov_email]);
        if (existingEmail.rows.length > 0) {
            return res.status(400).json({ message: 'Staff already exists with this email' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const newStaff = await db.query(
            'INSERT INTO ward_staff (gov_email, password_hash, city_id, ward_id, civic_body_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, gov_email, city_id, ward_id, civic_body_id',
            [gov_email, password_hash, city_id, ward_id, civic_body_id]
        );

        res.status(201).json({ message: 'Ward staff registered successfully', staff: newStaff.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

const loginWardStaff = async (req, res) => {
    try {
        const { gov_email, password } = req.body;

        const staffQuery = await db.query('SELECT * FROM ward_staff WHERE gov_email = $1', [gov_email]);
        if (staffQuery.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const staff = staffQuery.rows[0];
        const validPassword = await bcrypt.compare(password, staff.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken({ 
            id: staff.id, 
            role: 'ward_staff', 
            city_id: staff.city_id,
            ward_id: staff.ward_id,
            civic_body_id: staff.civic_body_id
        });
        
        res.json({ token, staff: { id: staff.id, gov_email: staff.gov_email, ward_id: staff.ward_id } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const newUser = await db.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, trust_score',
            [email, password_hash]
        );

        res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userQuery = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userQuery.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = userQuery.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const wardRes = user.ward_id ? await db.query('SELECT ward_name FROM wards WHERE id = $1', [user.ward_id]) : null;
        const wardName = wardRes?.rows[0]?.ward_name || null;

        const token = generateToken({ id: user.id, role: 'user', ward_id: user.ward_id });
        res.json({ token, user: { 
            id: user.id, 
            email: user.email, 
            trust_score: user.trust_score,
            ward_id: user.ward_id,
            ward_name: wardName,
            latitude: user.latitude,
            longitude: user.longitude
        } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};


const updateUserLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const userId = req.user.id; 

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const ward = await wardService.findWardByCoordinates(latitude, longitude);
        let wardId = ward?.id;
        let wardName = ward?.name;
        
        let assignedMsg = 'Ward updated successfully';
        if (!wardId) {
            console.warn(`[Location] Coordinates ${latitude},${longitude} not within any ward polygon. Assigning fallback Ward 1.`);
            // Fallback to Ward 1 (Hardcoded search for simplicity or just ID 1 if known)
            const fallback = await db.query("SELECT id, ward_name FROM wards WHERE city_id = 2 AND ward_number = '1' LIMIT 1");
            wardId = fallback.rows[0]?.id || 1;
            wardName = fallback.rows[0]?.ward_name || 'Ward 1';
            assignedMsg = 'Location falls outside defined ward bounds. Assigned fallback Ward 1.';
        }

        await db.query(
            'UPDATE users SET latitude = $1, longitude = $2, ward_id = $3 WHERE id = $4',
            [latitude, longitude, wardId, userId]
        );

        res.json({
            message: assignedMsg,
            latitude,
            longitude,
            ward_id: wardId,
            ward_name: wardName
        });
    } catch (error) {
        console.error('Update Location Error:', error);
        res.status(500).json({ message: 'Server error updating location' });
    }
};

module.exports = {
    registerAdmin, loginAdmin,
    registerWardStaff, loginWardStaff,
    registerUser, loginUser,
    updateUserLocation
};

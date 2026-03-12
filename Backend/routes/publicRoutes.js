import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/meta', async (req, res) => {
    try {
        const citiesRes = await pool.query('SELECT id, city_name FROM cities ORDER BY city_name');
        const wardsRes = await pool.query('SELECT id, ward_name, ward_number, city_id FROM wards ORDER BY ward_name');
        const bodiesRes = await pool.query('SELECT id, name FROM civic_bodies ORDER BY id');

        res.json({
            cities: citiesRes.rows,
            wards: wardsRes.rows,
            civic_bodies: bodiesRes.rows
        });
    } catch (error) {
        console.error("Meta API Error:", error);
        res.status(500).json({ error: 'Failed to fetch metadata' });
    }
});

export default router;

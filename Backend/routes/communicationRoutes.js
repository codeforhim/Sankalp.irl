const express = require('express');
const router = express.Router();
const db = require('../config/db');
const axios = require('axios');
const { authenticateToken, restrictToRole } = require('../middleware/authMiddleware');

const COMM_AI_URL = process.env.COMMUNICATION_AI_URL || 'http://communication-ai:8001';

/**
 * GET /communication/updates/:complaintId
 * Returns AI-generated updates for a specific complaint
 */
router.get('/updates/:complaintId', authenticateToken, async (req, res) => {
    try {
        const { complaintId } = req.params;
        const result = await db.query(
            'SELECT * FROM public_updates WHERE complaint_id = $1 ORDER BY created_at DESC',
            [complaintId]
        );
        res.json({ updates: result.rows });
    } catch (error) {
        console.error('Error fetching updates:', error.message);
        res.status(500).json({ message: 'Failed to fetch updates' });
    }
});

/**
 * GET /communication/public-feed
 * Returns the latest public updates (no auth required for transparency)
 */
router.get('/public-feed', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const result = await db.query(
            `SELECT pu.*, c.issue_type, c.status, c.ward_id
             FROM public_updates pu
             LEFT JOIN complaints c ON pu.complaint_id = c.id
             WHERE pu.update_type = 'status_update'
             ORDER BY pu.created_at DESC
             LIMIT $1`,
            [limit]
        );
        res.json({ updates: result.rows });
    } catch (error) {
        console.error('Error fetching public feed:', error.message);
        res.status(500).json({ message: 'Failed to fetch public feed' });
    }
});

/**
 * GET /communication/my-notifications
 * Returns AI-generated citizen notifications for the logged-in user's complaints
 */
router.get('/my-notifications', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            `SELECT pu.*, c.issue_type, c.status, c.text_input
             FROM public_updates pu
             JOIN complaints c ON pu.complaint_id = c.id
             WHERE c.user_id = $1 AND pu.update_type = 'citizen_notification'
             ORDER BY pu.created_at DESC
             LIMIT 50`,
            [userId]
        );
        res.json({ notifications: result.rows });
    } catch (error) {
        console.error('Error fetching notifications:', error.message);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
});

/**
 * POST /communication/ward-summary/:wardId
 * Generates a ward activity summary using AI
 */
router.post('/ward-summary/:wardId', authenticateToken, restrictToRole(['ward_staff', 'admin']), async (req, res) => {
    try {
        const { wardId } = req.params;

        // Get detailed ward breakdown
        let query = `SELECT status, ai_feedback FROM complaints WHERE ward_id = $1`;
        const params = [wardId];

        if (req.user.role === 'ward_staff') {
            query += ` AND civic_body_id = $2`;
            params.push(req.user.civic_body_id);
        }

        const complaintsRes = await db.query(query, params);

        let verified = 0, resolved = 0, in_progress = 0, needs_redo = 0, flagged = 0, reported = 0;

        complaintsRes.rows.forEach(row => {
            if (row.status === 'verified') verified++;
            else if (row.status === 'resolved') resolved++;
            else if (row.status === 'flagged_for_review') flagged++;
            else if (row.status === 'reported') reported++;
            else if (row.status === 'in_progress' || row.status === 'assigned') {
                if (row.ai_feedback && row.ai_feedback.startsWith('REJECTED BY ADMIN')) {
                    needs_redo++;
                } else {
                    in_progress++;
                }
            }
        });

        const wardRes = await db.query('SELECT ward_name FROM wards WHERE id = $1', [wardId]);
        const wardName = wardRes.rows[0]?.ward_name || `Ward ${wardId}`;

        const payload = {
            ward_name: wardName,
            verified,
            resolved,
            in_progress,
            needs_redo,
            flagged,
            reported,
        };

        const aiResponse = await axios.post(`${COMM_AI_URL}/generate/ward-summary`, payload, { timeout: 15000 });

        res.json({
            summary: aiResponse.data.message,
            stats: payload,
        });
    } catch (error) {
        console.error('Ward summary generation failed:', error.message);
        res.status(500).json({
            message: 'Failed to generate ward summary',
            fallback: `Ward ${req.params.wardId} activity summary is currently unavailable.`
        });
    }
});

module.exports = router;

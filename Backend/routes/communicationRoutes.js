const express = require('express');
const router = express.Router();
const db = require('../config/db');
const axios = require('axios');
const { authenticateToken, restrictToRole, optionalAuthenticateToken } = require('../middleware/authMiddleware');const COMM_AI_URL = process.env.COMMUNICATION_AI_URL || 'http://unified-ai:7860';

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
router.get('/public-feed', optionalAuthenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const userId = req.user ? req.user.id : null;
        
        const result = await db.query(
            `SELECT pu.*, c.issue_type, c.status, c.ward_id,
                (SELECT COUNT(*) FROM update_reactions ur WHERE ur.update_id = pu.id AND ur.reaction_type = 'like') as likes_count,
                (SELECT COUNT(*) FROM update_reactions ur WHERE ur.update_id = pu.id AND ur.reaction_type = 'dislike') as dislikes_count,
                (SELECT COUNT(*) FROM feedback f WHERE f.update_id = pu.id) as comments_count,
                (SELECT reaction_type FROM update_reactions ur WHERE ur.update_id = pu.id AND ur.user_id = $2 LIMIT 1) as user_reaction
             FROM public_updates pu
             LEFT JOIN complaints c ON pu.complaint_id = c.id
             WHERE pu.update_type = 'status_update'
             ORDER BY pu.created_at DESC
             LIMIT $1`,
            [limit, userId]
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
 * POST /communication/generate/citizen-help
 * Proxies request to LokSahayak AI Assistant
 */
router.post('/generate/citizen-help', optionalAuthenticateToken, async (req, res) => {
    try {
        const { user_query } = req.body;
        if (!user_query) {
            return res.status(400).json({ message: 'Query is required' });
        }

        const aiResponse = await axios.post(`${COMM_AI_URL}/generate/citizen-help`, { user_query }, { timeout: 30000 });
        res.json(aiResponse.data);
    } catch (error) {
        console.error('LokSahayak generation failed:', error.message);
        res.status(500).json({ message: 'Failed to fetch help from LokSahayak' });
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

/**
 * POST /communication/updates/:id/react
 * Toggles a reaction (like/dislike) for an update by the logged-in user
 */
router.post('/updates/:id/react', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { reaction_type } = req.body; // 'like' or 'dislike' or null
        const userId = req.user.id;

        if (reaction_type && !['like', 'dislike'].includes(reaction_type)) {
            return res.status(400).json({ message: 'Invalid reaction type' });
        }

        // Check existing
        const existing = await db.query(
            'SELECT reaction_type FROM update_reactions WHERE update_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existing.rows.length > 0) {
            if (existing.rows[0].reaction_type === reaction_type) {
                // Toggle off if same reaction
                await db.query('DELETE FROM update_reactions WHERE update_id = $1 AND user_id = $2', [id, userId]);
                return res.json({ message: 'Reaction removed' });
            } else if (reaction_type) {
                // Update to new reaction
                await db.query(
                    'UPDATE update_reactions SET reaction_type = $1, created_at = CURRENT_TIMESTAMP WHERE update_id = $2 AND user_id = $3',
                    [reaction_type, id, userId]
                );
                return res.json({ message: 'Reaction updated' });
            } else {
                // reaction_type is null - removed
                await db.query('DELETE FROM update_reactions WHERE update_id = $1 AND user_id = $2', [id, userId]);
                return res.json({ message: 'Reaction removed' });
            }
        } else if (reaction_type) {
            // Insert new reaction
            await db.query(
                'INSERT INTO update_reactions (update_id, user_id, reaction_type) VALUES ($1, $2, $3)',
                [id, userId, reaction_type]
            );
            return res.status(201).json({ message: 'Reaction added' });
        }
        
        res.json({ message: 'No action taken' });
    } catch (error) {
        console.error('Reaction error:', error.message);
        res.status(500).json({ message: 'Failed to process reaction' });
    }
});

/**
 * GET /communication/updates/:id/reactions
 * Get aggregate reactions for a specific update
 */
router.get('/updates/:id/reactions', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `SELECT reaction_type, COUNT(*) as count 
             FROM update_reactions 
             WHERE update_id = $1 
             GROUP BY reaction_type`,
            [id]
        );
        
        const reactions = { likes: 0, dislikes: 0 };
        result.rows.forEach(r => {
            if (r.reaction_type === 'like') reactions.likes = parseInt(r.count);
            if (r.reaction_type === 'dislike') reactions.dislikes = parseInt(r.count);
        });

        res.json(reactions);
    } catch (error) {
        console.error('Fetch reactions error:', error.message);
        res.status(500).json({ message: 'Failed to fetch reactions' });
    }
});

/**
 * POST /communication/updates/:id/feedback
 * Submit a comment/feedback for a specific update
 */
router.post('/updates/:id/feedback', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;
        const userId = req.user.id;

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({ message: 'Comment cannot be empty' });
        }

        const result = await db.query(
            'INSERT INTO feedback (update_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *',
            [id, userId, comment.trim()]
        );

        res.status(201).json({ message: 'Feedback added', feedback: result.rows[0] });
    } catch (error) {
        console.error('Submit feedback error:', error.message);
        res.status(500).json({ message: 'Failed to submit feedback' });
    }
});

/**
 * GET /communication/updates/:id/feedback
 * Get feedback/comments for a specific public update
 */
router.get('/updates/:id/feedback', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `SELECT f.*, u.email as user_email
             FROM feedback f
             JOIN users u ON f.user_id = u.id
             WHERE f.update_id = $1
             ORDER BY f.created_at ASC`,
            [id]
        );

        // Don't expose full emails, mask them
        const feedback = result.rows.map(row => {
            const parts = row.user_email.split('@');
            const maskedUser = parts[0].substring(0, 3) + '***@' + parts[1];
            return {
                ...row,
                user_name: maskedUser,
                user_email: undefined // Remove actual email
            };
        });

        res.json({ feedback });
    } catch (error) {
        console.error('Fetch feedback error:', error.message);
        res.status(500).json({ message: 'Failed to fetch feedback' });
    }
});

/**
 * GET /communication/ward/:wardId/feedback
 * Ward Officer Dashboard API - Get feedback consolidated by ward
 */
router.get('/ward/:wardId/feedback', authenticateToken, restrictToRole(['ward_staff', 'admin']), async (req, res) => {
    try {
        const { wardId } = req.params;

        const result = await db.query(
            `SELECT f.id, f.comment, f.created_at, pu.message as update_message, c.issue_type, c.id as complaint_id
             FROM feedback f
             JOIN public_updates pu ON f.update_id = pu.id
             JOIN complaints c ON pu.complaint_id = c.id
             WHERE c.ward_id = $1
             ORDER BY f.created_at DESC
             LIMIT 50`,
            [wardId]
        );

        res.json({ feedback: result.rows });
    } catch (error) {
        console.error('Ward feedback insights error:', error.message);
        res.status(500).json({ message: 'Failed to fetch ward feedback insights' });
    }
});

module.exports = router;

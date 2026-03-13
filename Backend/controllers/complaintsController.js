const db = require('../config/db');
const geoService = require('../services/geoService');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const createComplaint = async (req, res) => {
    try {
        const { text_input, audio_url, issue_type, priority_score, latitude, longitude } = req.body;
        const user_id = req.user.id;
        let image_url = req.body.image_url || null;

        // If a file was uploaded, use its path as the image_url
        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
        }

        // 1. Determine ward using PostGIS
        const ward_id = await geoService.findWardByCoordinates(latitude, longitude);

        if (!ward_id) {
            return res.status(400).json({ message: 'Coordinates do not fall within any known ward.' });
        }

        // Fetch city_id for this ward to populate the complaints table correctly
        const wardResult = await db.query('SELECT city_id FROM wards WHERE id = $1', [ward_id]);
        if (wardResult.rows.length === 0) {
            return res.status(500).json({ message: 'Ward exists but city link missing.' });
        }
        const city_id = wardResult.rows[0].city_id;

        // 2. Determine department (In reality from ML pipeline, we mock for now or expect from frontend)
        // For this prompt, if civic_body_id is not provided, we fall back to a default (e.g. 1 - PWD)
        // A real system would have the ML service inject this
        const civic_body_id = req.body.civic_body_id || 1; 

        // 3. Insert complaint into database
        const newComplaint = await db.query(
            `INSERT INTO complaints 
            (user_id, city_id, ward_id, civic_body_id, text_input, audio_url, image_url, issue_type, priority_score, latitude, longitude) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING *`,
            [user_id, city_id, ward_id, civic_body_id, text_input, audio_url, image_url, issue_type, priority_score || 0, latitude, longitude]
        );

        res.status(201).json({ message: 'Complaint created successfully', complaint: newComplaint.rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating complaint' });
    }
};

const getComplaintsByCity = async (req, res) => {
    try {
        const { city_id } = req.params;
        const complaints = await db.query('SELECT * FROM complaints WHERE city_id = $1 ORDER BY created_at DESC', [city_id]);
        res.json(complaints.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error retrieving complaints' });
    }
};

const getComplaintsByWard = async (req, res) => {
    try {
        const { ward_id } = req.params;
        const city_id = req.user?.city_id; // For ward_staff, always filter by their city
        
        // Ensure we filter by both ward and city to avoid leakage
        let query = 'SELECT * FROM complaints WHERE ward_id = $1';
        const params = [ward_id];

        if (city_id) {
            query += ' AND city_id = $' + (params.length + 1);
            params.push(city_id);
        }

        if (req.user && req.user.role === 'ward_staff') {
            query += ' AND civic_body_id = $2';
            params.push(req.user.civic_body_id);
        }

        query += ' ORDER BY created_at DESC';

        const complaints = await db.query(query, params);
        res.json(complaints.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error retrieving complaints' });
    }
};

const updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        console.log(`Update request for complaint ${id}: new status = [${status}]`);

        const validStatuses = ['reported', 'assigned', 'in_progress', 'resolved', 'verified', 'flagged_for_review', 'rejected'];
        if (!validStatuses.includes(status)) {
            console.error(`Invalid status attempted: ${status}`);
            return res.status(400).json({ message: 'Invalid status update' });
        }

        const updatedComplaint = await db.query(
            'UPDATE complaints SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (updatedComplaint.rows.length === 0) {
            console.warn(`No complaint found with ID ${id} to update.`);
            return res.status(404).json({ message: 'Complaint not found' });
        }

        console.log(`Successfully updated complaint ${id} to ${status}`);
        res.json({ message: 'Status updated successfully', complaint: updatedComplaint.rows[0] });
    } catch (error) {
        console.error(`Error updating status for complaint ${req.params.id}:`, error.message);
        res.status(500).json({ message: 'Server error updating complaint' });
    }
};

const verifyResolution = async (req, res) => {
    try {
        const { id: complaint_id } = req.params;
        const afterImageFile = req.file;

        if (!afterImageFile) {
            return res.status(400).json({ message: 'Missing after_image file proof.' });
        }

        // 1. Fetch original "Before" image record
        const complaintRes = await db.query('SELECT image_url FROM complaints WHERE id = $1', [complaint_id]);
        if (complaintRes.rows.length === 0) {
            return res.status(404).json({ message: 'Complaint not found.' });
        }

        const beforeImageUrl = complaintRes.rows[0].image_url;
        // In a real app we might fetch from S3. Here we simulate the python analysis getting it
        // Or if 'image_url' is a local file, we would stream it. Let's assume the frontend sends both
        // for simplicity, or we send a dummy if before_image is missing locally.
        
        // Read file into buffer for more reliable transfer
        const afterImageBuffer = fs.readFileSync(afterImageFile.path);
        
        // Construct multipart form-data to send to Python server
        const formData = new FormData();
        formData.append('after_image', afterImageBuffer, { 
            filename: afterImageFile.originalname,
            contentType: afterImageFile.mimetype
        });
        
        // Simulating the before image (using the same buffer for now)
        formData.append('before_image', afterImageBuffer, { 
            filename: 'mock_before.jpg',
            contentType: 'image/jpeg'
        });

        console.log(`Sending images (Buffers) to Python AI Server for complaint ${complaint_id}...`);

        let aiData;
        try {
            // Forward to Python FastAPI Container with timeout
            const aiResponse = await axios.post('http://ml_vision:8080/verify-issue', formData, {
                headers: {
                    ...formData.getHeaders()
                },
                timeout: 30000 // 30 second timeout
            });
            aiData = aiResponse.data;
            console.log(`AI Output for complaint ${complaint_id}:`, JSON.stringify(aiData));
        } catch (aiError) {
            console.error(`AI Service Error for complaint ${complaint_id}:`, aiError.message);
            aiData = { 
                resolved: false, 
                ai_generated: false, 
                message: "AI Verification Service is currently unavailable or timed out.",
                error: aiError.message 
            };
        }

        // Determine what status to assign based on the AI Response
        let newStatus = 'in_progress';
        if (aiData.ai_generated || !aiData.resolved) {
            newStatus = 'flagged_for_review'; // Admin must check this!
        } else if (!aiData.ai_generated && aiData.resolved) {
            newStatus = 'resolved'; // AI confirms it's fixed!
        }

        console.log(`Determined new status for complaint ${complaint_id}: ${newStatus}`);

        // Update Database
        const afterImageUrl = `/uploads/${afterImageFile.filename}`;
        const aiFeedback = aiData.message || "AI Verification processed.";
        console.log(`Updating DB for complaint ${complaint_id}: status=${newStatus}, after_image_url=${afterImageUrl}`);
        
        try {
            const updateRes = await db.query(
                `UPDATE complaints SET status = $1, after_image_url = $2, ai_feedback = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`, 
                [newStatus, afterImageUrl, aiFeedback, parseInt(complaint_id)]
            );
            console.log(`DB Update Result:`, updateRes.rowCount > 0 ? "SUCCESS" : "FAILURE (No row found)");
        } catch (dbErr) {
            console.error(`CRITICAL DB ERROR during status update:`, dbErr.message);
            throw dbErr;
        }

        return res.status(200).json({
            message: 'AI Assessment Complete',
            new_status: newStatus,
            ai_analysis: aiData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error verifying resolution' });
    }
};

module.exports = {
   createComplaint,
   getComplaintsByCity,
   getComplaintsByWard,
   updateComplaintStatus,
   verifyResolution
};

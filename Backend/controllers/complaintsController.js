const db = require('../config/db');
const geoService = require('../services/geoService');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const priorityService = require('../services/priorityService');
const wardService = require('../services/wardService');

const createComplaint = async (req, res) => {
    try {
        const { text_input, priority_score } = req.body;
        const user_id = req.user.id;

        let image_url = null;
        let audio_url = null;

        let imageFile = null;
        let audioFile = null;

        // The route now uses upload.fields
        if (req.files) {
            if (req.files.image && req.files.image.length > 0) {
                imageFile = req.files.image[0];
                image_url = `/uploads/${imageFile.filename}`;
            }
            if (req.files.audio && req.files.audio.length > 0) {
                audioFile = req.files.audio[0];
                audio_url = `/uploads/${audioFile.filename}`;
            }
        }

        // AI Classification Integration
        let ai_issue_type = "Unknown";
        let ai_department = "Unknown";
        let ai_confidence = 0.0;

        try {
            if (imageFile) {
                console.log("Sending image to AI classification...");
                const formData = new FormData();
                const imageBuffer = fs.readFileSync(imageFile.path);
                formData.append('image', imageBuffer, {
                    filename: imageFile.originalname,
                    contentType: imageFile.mimetype
                });
                const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
                const aiRes = await axios.post(`${AI_SERVICE_URL}/classify/image`, formData, {
                    headers: formData.getHeaders(),
                    timeout: 30000
                });
                ai_issue_type = aiRes.data.issue_type;
                ai_department = aiRes.data.department;
                ai_confidence = aiRes.data.confidence;
            } else if (audioFile) {
                console.log("Sending audio to AI classification...");
                const formData = new FormData();
                const audioBuffer = fs.readFileSync(audioFile.path);
                formData.append('audio', audioBuffer, {
                    filename: audioFile.originalname,
                    contentType: audioFile.mimetype
                });
                const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
                const aiRes = await axios.post(`${AI_SERVICE_URL}/classify/audio`, formData, {
                    headers: formData.getHeaders(),
                    timeout: 30000
                });
                ai_issue_type = aiRes.data.issue_type;
                ai_department = aiRes.data.department;
                ai_confidence = aiRes.data.confidence;
            } else if (text_input) {
                console.log("Sending text to AI classification...");
                const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
                const aiRes = await axios.post(`${AI_SERVICE_URL}/classify/text`, { text: text_input }, {
                    timeout: 10000
                });
                ai_issue_type = aiRes.data.issue_type;
                ai_department = aiRes.data.department;
                ai_confidence = aiRes.data.confidence;
            }
        } catch (aiErr) {
            console.error("AI service error during complaint creation:", aiErr.message);
        }

        // Note: The prompt instructed setting ward_id, latitude, longitude to NULL, 
        // but latitude/longitude have NOT NULL constraints in the database schema.
        // Pull latitude and longitude from the request body.
        const { latitude, longitude } = req.body;
        
        // 1. Determine ward_id
        // Try to get from request body, then from user profile, then fallback to spatial lookup
        let ward_id = req.body.ward_id || req.user.ward_id;
        
        if (!ward_id && latitude && longitude) {
            // Attempt spatial lookup if missing
            ward_id = await wardService.findWardByCoordinates(latitude, longitude);
        }
        
        // Final fallback if outside bounds or no coords
        if (!ward_id) {
            console.warn(`[Complaint Creation] Could not determine ward for user ${user_id}. Assigning fallback Ward 1.`);
            ward_id = 1;
        }

        let city_id = req.body.city_id || req.user?.city_id || 2; // Defaulting to 2 (Delhi)

        // 2. Determine department (Map AI department text to civic_body_id)
        // From db/init.sql, civic_bodies are:
        // 1: Public Works Department (PWD)
        // 2: Water Works Department
        // 3: Sanitation Department
        // 4: Electricity Department
        // 5: Urban Planning Authority

        const departmentMap = {
            "Public Works Department": 1,
            "Water Works": 2,
            "Sanitation": 3,
            "Electrical Works": 4
        };

        // AI returns "department" along with "issue_type". We grab it from aiRes data if it exists.
        // If the frontend explicitly sends one, use that, otherwise map the AI one, fallback to 1 (PWD)
        const mappedId = ai_department ? departmentMap[ai_department] : null;
        const civic_body_id = req.body.civic_body_id || mappedId || 1; 

        // 2.5 Compute priority scores using the AI issue type and ward
        const priorityData = await priorityService.calculatePriority(ai_issue_type, ward_id);

        // 3. Insert complaint into database
        const newComplaint = await db.query(
            `INSERT INTO complaints 
            (user_id, city_id, ward_id, civic_body_id, text_input, audio_url, image_url, issue_type, priority_score, impact_score, recurrence_score, latitude, longitude, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
            RETURNING *`,
            [user_id, city_id, ward_id, civic_body_id, text_input, audio_url, image_url, ai_issue_type, priorityData.priority_score, priorityData.impact_score, priorityData.recurrence_score, latitude, longitude, 'reported']
        );

        // Reverse map so we can tell the frontend which department it is friendly string
        const departmentStringMap = {
            1: "Public Works Department (PWD)",
            2: "Water Works Department",
            3: "Sanitation Department",
            4: "Electricity Department",
            5: "Urban Planning Authority"
        };
        const departmentName = departmentStringMap[civic_body_id] || "Unknown Department";

        res.status(201).json({ message: 'Complaint created successfully', complaint: newComplaint.rows[0], confidence: ai_confidence, department: departmentName });

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
            query += ' AND civic_body_id = $' + (params.length + 1);
            params.push(req.user.civic_body_id);
        }

        query += ' ORDER BY priority_score DESC NULLS LAST, created_at DESC';

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

        let updatedComplaint;
        if (status === 'rejected') {
            updatedComplaint = await db.query(
                "UPDATE complaints SET status = $1, after_image_url = NULL, ai_feedback = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
                ['in_progress', 'REJECTED BY ADMIN: Your proof of resolution was not accepted. Please re-upload a clear completion photo.', id]
            );
        } else {
            updatedComplaint = await db.query(
                'UPDATE complaints SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [status, id]
            );
        }

        if (updatedComplaint.rows.length === 0) {
            console.warn(`No complaint found with ID ${id} to update.`);
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const complaint = updatedComplaint.rows[0];
        console.log(`Successfully updated complaint ${id} to ${status}`);

        // [Citizen Credibility] Close the poll and calculate scores
        if (status === 'verified' || status === 'rejected') {
            const adminVerdict = status === 'verified' ? 'approved' : 'rejected';
            
            try {
                const pollRes = await db.query(
                    "UPDATE complaint_polls SET is_active = FALSE, admin_verdict = $1, closed_at = CURRENT_TIMESTAMP WHERE complaint_id = $2 RETURNING id",
                    [adminVerdict, id]
                );
                
                if (pollRes.rowCount > 0) {
                    const pollId = pollRes.rows[0].id;
                    const votes = await db.query("SELECT user_id, vote FROM poll_votes WHERE poll_id = $1", [pollId]);
                    const correctVote = adminVerdict === 'approved' ? 'done' : 'not_done';
                    
                    for (const vote of votes.rows) {
                        if (vote.vote === correctVote) {
                            await db.query(`
                                UPDATE users 
                                SET credibility_score = LEAST(COALESCE(credibility_score, 50) + 5, 100), 
                                    credibility_votes_correct = COALESCE(credibility_votes_correct, 0) + 1 
                                WHERE id = $1
                            `, [vote.user_id]);
                        } else {
                            await db.query(`
                                UPDATE users 
                                SET credibility_score = GREATEST(COALESCE(credibility_score, 50) - 2, 0)
                                WHERE id = $1
                            `, [vote.user_id]);
                        }
                    }
                    console.log(`[Credibility] Processed ${votes.rowCount} votes for poll ${pollId}. Verdict: ${adminVerdict}`);
                }
            } catch (pollErr) {
                console.error(`[Credibility] Error processing votes:`, pollErr.message);
            }
        }

        // Fire-and-forget: Generate AI communication messages
        // RULE: Only ADMIN actions go to public feed. Ward officer actions only notify the citizen.
        const COMM_AI_URL = process.env.COMMUNICATION_AI_URL || 'http://communication-ai:8001';
        const departmentStringMap = {
            1: "Public Works Department (PWD)",
            2: "Water Works Department",
            3: "Sanitation Department",
            4: "Electricity Department",
            5: "Urban Planning Authority"
        };
        const deptName = departmentStringMap[complaint.civic_body_id] || "Municipal Services";
        const userRole = req.user?.role || 'ward_staff';
        const isAdminAction = (userRole === 'admin');

        (async () => {
            try {
                // Always generate citizen notification (private to the citizen)
                const notifRes = await axios.post(`${COMM_AI_URL}/generate/citizen-notification`, {
                    issue_type: complaint.issue_type || 'civic issue',
                    status: status,
                    department: deptName,
                }, { timeout: 15000 });

                await db.query(
                    'INSERT INTO public_updates (complaint_id, message, update_type) VALUES ($1, $2, $3)',
                    [id, notifRes.data.message, 'citizen_notification']
                );

                // Only admin actions generate public feed updates
                if (isAdminAction) {
                    const statusRes = await axios.post(`${COMM_AI_URL}/generate/status-update`, {
                        issue_type: complaint.issue_type || 'civic issue',
                        ward_name: `Ward ${complaint.ward_id}`,
                        department: deptName,
                        status: status,
                        description: complaint.text_input || '',
                    }, { timeout: 15000 });

                    await db.query(
                        'INSERT INTO public_updates (complaint_id, message, update_type) VALUES ($1, $2, $3)',
                        [id, statusRes.data.message, 'status_update']
                    );
                    console.log(`[CommAI] Admin action → public update + citizen notification for complaint ${id}`);
                } else {
                    console.log(`[CommAI] Ward officer action → citizen notification only for complaint ${id}`);
                }
            } catch (aiErr) {
                console.error(`[CommAI] Failed for complaint ${id}:`, aiErr.message);
            }
        })();

        res.json({ message: 'Status updated successfully', complaint });
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
            const ML_VISION_URL = process.env.ML_VISION_URL || 'http://ml_vision:8080';
            const aiResponse = await axios.post(`${ML_VISION_URL}/verify-issue`, formData, {
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
        if (aiData.ai_generated || !aiData.resolved || aiData.confidence < 0.70) {
            newStatus = 'flagged_for_review'; // Admin must check this if confidence is low!
        } else if (!aiData.ai_generated && aiData.resolved && aiData.confidence >= 0.70) {
            newStatus = 'resolved'; // AI confirms it's fixed with > 70% confidence!
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

            if (updateRes.rowCount > 0) {
                const complaint = updateRes.rows[0];
                
                // [Citizen Credibility] Create a poll for citizens to verify the work
                try {
                    await db.query(`
                        INSERT INTO complaint_polls (complaint_id, before_image_url, after_image_url) 
                        VALUES ($1, $2, $3)
                        ON CONFLICT (complaint_id) DO UPDATE SET 
                            before_image_url = EXCLUDED.before_image_url,
                            after_image_url = EXCLUDED.after_image_url,
                            is_active = TRUE,
                            admin_verdict = NULL,
                            closed_at = NULL
                    `, [complaint_id, beforeImageUrl, afterImageUrl]);
                    console.log(`[Poll] Created/Updated poll for complaint ${complaint_id}`);
                } catch (pollErr) {
                    console.error(`[Poll] Failed to create poll:`, pollErr.message);
                }

                const COMM_AI_URL = process.env.COMMUNICATION_AI_URL || 'http://communication-ai:8001';
                
                // Fire-and-forget: Notify citizen of preliminary AI assessment
                (async () => {
                    try {
                        const notifRes = await axios.post(`${COMM_AI_URL}/generate/citizen-notification`, {
                            issue_type: complaint.issue_type || 'civic issue',
                            status: newStatus,
                        }, { timeout: 15000 });

                        await db.query(
                            'INSERT INTO public_updates (complaint_id, message, update_type) VALUES ($1, $2, $3)',
                            [complaint_id, notifRes.data.message, 'citizen_notification']
                        );
                        console.log(`[CommAI] Preliminary AI assessment notification sent for complaint ${complaint_id}`);
                    } catch (aiErr) {
                        console.error(`[CommAI] Failed preliminary notif for complaint ${complaint_id}:`, aiErr.message);
                    }
                })();
            }
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

const getMyComplaints = async (req, res) => {
    try {
        const user_id = req.user.id;
        const complaints = await db.query('SELECT * FROM complaints WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
        res.json(complaints.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error retrieving complaints' });
    }
};

module.exports = {
    createComplaint,
    getComplaintsByCity,
    getComplaintsByWard,
    updateComplaintStatus,
    verifyResolution,
    getMyComplaints
};

const db = require('../config/db');

const getActivePolls = async (req, res) => {
    try {
        const user_id = req.user.id;
        
        // Find polls that are active, and the user hasn't voted on yet
        const query = `
            SELECT cp.*, c.text_input, c.issue_type, c.ward_id, c.civic_body_id 
            FROM complaint_polls cp
            JOIN complaints c ON cp.complaint_id = c.id
            WHERE cp.is_active = TRUE
            AND cp.id NOT IN (
                SELECT poll_id FROM poll_votes WHERE user_id = $1
            )
            ORDER BY cp.created_at DESC
        `;
        const result = await db.query(query, [user_id]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching active polls:", error);
        res.status(500).json({ message: "Server error fetching polls" });
    }
};

const castVote = async (req, res) => {
    try {
        const poll_id = req.params.id;
        const { vote } = req.body; // 'done' or 'not_done'
        const user_id = req.user.id;

        if (!['done', 'not_done'].includes(vote)) {
            return res.status(400).json({ message: "Invalid vote" });
        }

        // Check if poll exists and is active
        const pollRes = await db.query("SELECT * FROM complaint_polls WHERE id = $1 AND is_active = TRUE", [poll_id]);
        if (pollRes.rowCount === 0) {
            return res.status(404).json({ message: "Poll not found or inactive" });
        }

        // Insert vote
        await db.query(`
            INSERT INTO poll_votes (poll_id, user_id, vote)
            VALUES ($1, $2, $3)
            ON CONFLICT (poll_id, user_id) DO NOTHING
        `, [poll_id, user_id, vote]);

        // Increment user's total credibility votes
        await db.query(`
            UPDATE users SET credibility_votes_total = credibility_votes_total + 1 WHERE id = $1
        `, [user_id]);

        res.json({ message: "Vote cast successfully" });
    } catch (error) {
        console.error("Error casting vote:", error);
        res.status(500).json({ message: "Server error casting vote" });
    }
};

const getLeaderboard = async (req, res) => {
    try {
        const query = `
            SELECT id, email, credibility_score, credibility_votes_total, credibility_votes_correct
            FROM users 
            ORDER BY credibility_score DESC, credibility_votes_total DESC
            LIMIT 10
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ message: "Server error fetching leaderboard" });
    }
};

const getPollResults = async (req, res) => {
    try {
        const complaint_id = req.params.complaint_id;
        
        // Get poll for this complaint
        const pollRes = await db.query("SELECT * FROM complaint_polls WHERE complaint_id = $1", [complaint_id]);
        if (pollRes.rowCount === 0) {
             return res.json({ exists: false });
        }

        const poll = pollRes.rows[0];

        // Get votes aggregation
        const votesRes = await db.query(`
            SELECT vote, COUNT(*) as count 
            FROM poll_votes 
            WHERE poll_id = $1
            GROUP BY vote
        `, [poll.id]);
        
        let doneCount = 0;
        let notDoneCount = 0;

        votesRes.rows.forEach(row => {
            if(row.vote === 'done') doneCount = parseInt(row.count);
            if(row.vote === 'not_done') notDoneCount = parseInt(row.count);
        });

        res.json({
            exists: true,
            poll_id: poll.id,
            is_active: poll.is_active,
            admin_verdict: poll.admin_verdict,
            results: { done: doneCount, not_done: notDoneCount },
            total_votes: doneCount + notDoneCount
        });

    } catch (error) {
         console.error("Error fetching poll results:", error);
         res.status(500).json({ message: "Server error fetching poll results" });
    }
}

module.exports = {
    getActivePolls,
    castVote,
    getLeaderboard,
    getPollResults
};

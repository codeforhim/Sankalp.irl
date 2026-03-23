const express = require('express');
const router = express.Router();
const pollsController = require('../controllers/pollsController');
const { authenticateToken, restrictToRole } = require('../middleware/authMiddleware');

router.get('/active', authenticateToken, restrictToRole(['user']), pollsController.getActivePolls);
router.post('/:id/vote', authenticateToken, restrictToRole(['user']), pollsController.castVote);
router.get('/leaderboard', authenticateToken, pollsController.getLeaderboard);
router.get('/complaint/:complaint_id', authenticateToken, pollsController.getPollResults);

module.exports = router;

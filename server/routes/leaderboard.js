const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getLeaderboard } = require('../controllers/leaderboardController');

router.use(protect);
router.get('/', getLeaderboard);

module.exports = router;

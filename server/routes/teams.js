const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createTeam,
  joinTeam,
  getMyTeam,
  getTeamById,
  leaveTeam,
} = require('../controllers/teamController');

// All team routes require authentication
router.use(protect);

router.post('/', createTeam);
router.post('/join', joinTeam);
router.get('/me', getMyTeam);
router.get('/:id', getTeamById);
router.post('/:id/leave', leaveTeam);

module.exports = router;

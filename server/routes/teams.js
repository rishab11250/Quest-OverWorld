const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createTeam,
  joinTeam,
  cancelJoinRequest,
  getMyTeam,
  getTeamById,
  leaveTeam,
  updateTeam,
  kickMember,
  setViceCaptain,
  transferLeadership,
  approveJoinRequest,
  rejectJoinRequest,
  getMyTeamQuestHistory,
  getTeamActivity,
  getTeamAchievements,
} = require('../controllers/teamController');

// All team routes require authentication
router.use(protect);

router.post('/', createTeam);
router.post('/join', joinTeam);
router.post('/join/cancel', cancelJoinRequest);
router.get('/me', getMyTeam);
router.get('/me/history', getMyTeamQuestHistory);
router.get('/:id', getTeamById);
router.get('/:id/activity', getTeamActivity);
router.get('/:id/achievements', getTeamAchievements);
router.put('/:id', updateTeam);
router.patch('/:id', updateTeam);
router.post('/:id/leave', leaveTeam);
router.post('/:id/kick/:memberId', kickMember);
router.post('/:id/roles/vice-captain', setViceCaptain);
router.post('/:id/transfer-leadership', transferLeadership);
router.post('/:id/requests/:userId/approve', approveJoinRequest);
router.post('/:id/requests/:userId/reject', rejectJoinRequest);

module.exports = router;

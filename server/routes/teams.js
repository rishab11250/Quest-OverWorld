const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createTeam,
  joinTeam,
  getMyTeam,
  getTeamById,
  leaveTeam,
  updateTeam,
  kickMember,
  setViceCaptain,
  transferLeadership,
} = require('../controllers/teamController');

// All team routes require authentication
router.use(protect);

router.post('/', createTeam);
router.post('/join', joinTeam);
router.get('/me', getMyTeam);
router.get('/:id', getTeamById);
router.put('/:id', updateTeam);
router.patch('/:id', updateTeam);
router.post('/:id/leave', leaveTeam);
router.post('/:id/kick/:memberId', kickMember);
router.post('/:id/roles/vice-captain', setViceCaptain);
router.post('/:id/transfer-leadership', transferLeadership);

module.exports = router;

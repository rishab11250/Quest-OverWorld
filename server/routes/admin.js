const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const {
  getAdminOverview,
  getAllAdminQuests,
  createQuest,
  updateQuest,
  deleteQuest,
  getAllAdminCheckpoints,
  createCheckpoint,
  updateCheckpoint,
  deleteCheckpoint,
  getAllAdminChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
} = require('../controllers/adminController');

// All admin routes require JWT auth and admin role
router.use(protect);
router.use(requireAdmin);

// Overview
router.get('/overview', getAdminOverview);

// Quests CRUD
router.get('/quests', getAllAdminQuests);
router.post('/quests', createQuest);
router.put('/quests/:id', updateQuest);
router.delete('/quests/:id', deleteQuest);

// Checkpoints CRUD
router.get('/checkpoints', getAllAdminCheckpoints);
router.post('/checkpoints', createCheckpoint);
router.put('/checkpoints/:id', updateCheckpoint);
router.delete('/checkpoints/:id', deleteCheckpoint);

// Challenges CRUD
router.get('/challenges', getAllAdminChallenges);
router.post('/challenges', createChallenge);
router.put('/challenges/:id', updateChallenge);
router.delete('/challenges/:id', deleteChallenge);

module.exports = router;

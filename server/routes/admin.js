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
  getPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  reseedDemoData,
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

// Submission Review Queue
router.get('/submissions/pending', getPendingSubmissions);
router.post('/submissions/:id/approve', approveSubmission);
router.post('/submissions/:id/reject', rejectSubmission);

// System Operations
router.post('/system/reseed', reseedDemoData);

module.exports = router;

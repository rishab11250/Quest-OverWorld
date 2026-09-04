const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const {
  getAdminOverview,
  getAllAdminQuests,
  createQuest,
  updateQuest,
  getQuestResults,
  deleteQuest,
  getAllAdminCheckpoints,
  createCheckpoint,
  updateCheckpoint,
  getCheckpointQr,
  deleteCheckpoint,
  getAllAdminChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  getPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  reseedDemoData,
  getAllPlayers,
  updatePlayerStatus,
  updatePlayerRole,
  kickPlayerFromTeam,
  deletePlayer,
  getAllTeams,
  updateTeamStatus,
  deleteTeam,
  getConfig,
  updateConfig,
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
} = require('../controllers/adminController');

// All admin routes require JWT auth and admin role
router.use(protect);
router.use(requireAdmin);

// Overview
router.get('/overview', getAdminOverview);

// Player / Adventurer Management
router.get('/players', getAllPlayers);
router.patch('/players/:userId/status', updatePlayerStatus);
router.patch('/players/:userId/role', updatePlayerRole);
router.post('/players/:userId/kick', kickPlayerFromTeam);
router.delete('/players/:userId', deletePlayer);

// Guild / Team Management
router.get('/teams', getAllTeams);
router.patch('/teams/:id/status', updateTeamStatus);
router.delete('/teams/:id', deleteTeam);

// Quests CRUD & Historical Standings
router.get('/quests', getAllAdminQuests);
router.post('/quests', createQuest);
router.get('/quests/:id/results', getQuestResults);
router.put('/quests/:id', updateQuest);
router.delete('/quests/:id', deleteQuest);

// Checkpoints CRUD
router.get('/checkpoints', getAllAdminCheckpoints);
router.post('/checkpoints', createCheckpoint);
router.get('/checkpoints/:id/qr', getCheckpointQr);
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

// Game Configuration (Team size limits & rules)
router.route('/config').get(getConfig).put(updateConfig);

// Broadcast Announcements
router.route('/announcements').get(getAnnouncements).post(createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// System Operations
router.post('/system/reseed', reseedDemoData);

module.exports = router;

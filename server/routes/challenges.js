const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllChallenges,
  getChallengeById,
  submitChallenge,
  getChallengeAttemptStatus,
  solveChallenge,
  revealChallengeHint,
} = require('../controllers/challengeController');

// All challenge routes require authentication
router.use(protect);

router.get('/', getAllChallenges);
router.get('/:id', getChallengeById);
router.get('/:id/attempt-status', getChallengeAttemptStatus);
router.post('/:id/submit', submitChallenge);
router.post('/:id/solve', solveChallenge);
router.post('/:id/hint', revealChallengeHint);

module.exports = router;

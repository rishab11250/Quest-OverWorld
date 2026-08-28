const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllChallenges,
  getChallengeById,
  submitChallenge,
} = require('../controllers/challengeController');

// All challenge routes require authentication
router.use(protect);

router.get('/', getAllChallenges);
router.get('/:id', getChallengeById);
router.post('/:id/submit', submitChallenge);

module.exports = router;

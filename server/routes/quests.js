const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllQuests,
  getActiveQuest,
  getQuestById,
  joinQuest,
} = require('../controllers/questController');

// All quest routes require authentication
router.use(protect);

router.get('/', getAllQuests);
router.get('/active', getActiveQuest);
router.get('/:id', getQuestById);
router.post('/:id/join', joinQuest);

module.exports = router;

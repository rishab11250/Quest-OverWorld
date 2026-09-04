const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  verifyCheckpoint,
  getCheckpointHints,
  revealCheckpointHint,
} = require('../controllers/checkpointController');

// All checkpoint routes are protected
router.use(protect);

router.post('/verify', verifyCheckpoint);
router.get('/:id/hints', getCheckpointHints);
router.post('/:id/hint', revealCheckpointHint);

module.exports = router;

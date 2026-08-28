const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { verifyCheckpoint } = require('../controllers/checkpointController');

// All checkpoint routes are protected
router.use(protect);

router.post('/verify', verifyCheckpoint);

module.exports = router;

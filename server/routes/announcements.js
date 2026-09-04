const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Announcement = require('../models/Announcement');
const Team = require('../models/Team');

// @desc    Get active announcements relevant to the player / team
// @route   GET /api/announcements
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const team = await Team.findOne({ members: req.user._id });
    const teamQuestId = team ? team.questId : null;
    const now = new Date();

    const query = {
      $and: [
        {
          $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        },
        {
          $or: [{ questId: null }, ...(teamQuestId ? [{ questId: teamQuestId }] : [])],
        },
      ],
    };

    const announcements = await Announcement.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('createdBy', 'name');

    return res.status(200).json({
      success: true,
      announcements,
      count: announcements.length,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || 'Server error fetching announcements' });
  }
});

module.exports = router;

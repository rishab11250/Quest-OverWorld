const Checkpoint = require('../models/Checkpoint');
const Quest = require('../models/Quest');
const Team = require('../models/Team');
const Progress = require('../models/Progress');
const { getDistanceInMeters } = require('../utils/geo');

// @desc    Verify QR code and GPS proximity for a checkpoint
// @route   POST /api/checkpoints/verify
// @access  Private
const verifyCheckpoint = async (req, res) => {
  try {
    const { qrCode, latitude, longitude } = req.body;

    if (!qrCode) {
      return res.status(400).json({ message: 'QR code string is required for verification.' });
    }

    // 1. Verify user's party membership
    const team = await Team.findOne({ members: req.user._id });
    if (!team) {
      return res
        .status(400)
        .json({ message: 'You must belong to an active party to verify checkpoints.' });
    }

    if (!team.questId) {
      const defaultQuest = await Quest.findOne({ status: 'active' });
      if (!defaultQuest) {
        return res.status(400).json({ message: 'No active quest currently running.' });
      }
      team.questId = defaultQuest._id;
      await team.save();
    }

    // 2. Lookup checkpoint by QR code in current quest
    const checkpoint = await Checkpoint.findOne({
      questId: team.questId,
      qrCode: qrCode.trim(),
    });

    if (!checkpoint) {
      return res.status(400).json({ message: 'Invalid or unrecognized QR code for this quest.' });
    }

    // 3. Prevent duplicate completions (idempotency check)
    const existingProgress = await Progress.findOne({
      teamId: team._id,
      checkpointId: checkpoint._id,
    });

    if (existingProgress) {
      return res
        .status(400)
        .json({ message: 'This checkpoint has already been cleared by your party.' });
    }

    // 4. Enforce sequence order (must clear checkpoint n-1 before n)
    if (checkpoint.order > 1) {
      const prevCheckpoint = await Checkpoint.findOne({
        questId: team.questId,
        order: checkpoint.order - 1,
      });

      if (prevCheckpoint) {
        const prevCompleted = await Progress.findOne({
          teamId: team._id,
          checkpointId: prevCheckpoint._id,
        });

        if (!prevCompleted) {
          return res.status(400).json({
            message: `Sequence locked! You must discover Checkpoint #${checkpoint.order - 1} (${prevCheckpoint.title}) first.`,
          });
        }
      }
    }

    // 5. Enforce Mandatory GPS Proximity (Anti-Cheat)
    if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        message:
          'GPS location coordinates (latitude & longitude) are required for checkpoint verification. Please enable device location services.',
      });
    }

    const distance = getDistanceInMeters(
      latitude,
      longitude,
      checkpoint.latitude,
      checkpoint.longitude
    );

    const maxAllowedRadius = checkpoint.radius || 50; // default 50 meters
    // Allow slight GPS inaccuracy buffer (+25m buffer)
    const allowedWithBuffer = maxAllowedRadius + 25;

    if (distance == null || distance > allowedWithBuffer) {
      return res.status(400).json({
        message: `Too far from discovery site! You are ${distance ?? 'unknown'}m away (must be within ${maxAllowedRadius}m of ${checkpoint.title}). Move closer to landmark and re-scan.`,
        distance,
        allowedRadius: maxAllowedRadius,
      });
    }

    // 6. Record Progress
    const progress = await Progress.create({
      teamId: team._id,
      questId: team.questId,
      checkpointId: checkpoint._id,
      verifiedBy: req.user._id,
      pointsAwarded: checkpoint.points,
    });

    // 7. Update Team Score
    team.score = (team.score || 0) + checkpoint.points;
    await team.save();

    // 8. Find next unlocked checkpoint in sequence
    const nextCheckpoint = await Checkpoint.findOne({
      questId: team.questId,
      order: checkpoint.order + 1,
    });

    return res.status(200).json({
      success: true,
      message: `🎉 Checkpoint #${checkpoint.order} (${checkpoint.title}) successfully cleared!`,
      pointsAwarded: checkpoint.points,
      totalScore: team.score,
      clearedCheckpoint: {
        _id: checkpoint._id,
        title: checkpoint.title,
        order: checkpoint.order,
      },
      nextClue: nextCheckpoint
        ? {
            _id: nextCheckpoint._id,
            order: nextCheckpoint.order,
            title: nextCheckpoint.title,
            clue: nextCheckpoint.clue,
            points: nextCheckpoint.points,
            radius: nextCheckpoint.radius,
          }
        : null,
      isQuestCompleted: !nextCheckpoint,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Checkpoint was just verified by a teammate!' });
    }
    return res
      .status(500)
      .json({ message: error.message || 'Server error during checkpoint verification' });
  }
};

module.exports = {
  verifyCheckpoint,
};

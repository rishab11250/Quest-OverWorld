const { calculateAwardedXp, getGuildPerks, getPerkLossWarning } = require('../utils/guildPerks');
const Checkpoint = require('../models/Checkpoint');
const Quest = require('../models/Quest');
const Team = require('../models/Team');
const Progress = require('../models/Progress');
const TeamActivity = require('../models/TeamActivity');
const HintReveal = require('../models/HintReveal');
const { evaluateAchievements } = require('../services/achievementService');
const { getDistanceInMeters } = require('../utils/geo');

// @desc    Verify QR code and GPS proximity for a checkpoint
// @route   POST /api/checkpoints/verify
// @access  Private
const verifyCheckpoint = async (req, res) => {
  try {
    const { qrCode, latitude, longitude, scannedAt, locationStale } = req.body;

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

    if (team.isBanned || team.status === 'banned') {
      return res.status(403).json({
        message: `Guild "${team.name}" has been banned by the Guild Master Admin.${team.banReason ? ' Reason: ' + team.banReason : ''}`,
        isBanned: true,
      });
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

    // 2. Validate scan timestamp (reject if older than 5 minutes)
    if (scannedAt) {
      const scanDate = new Date(scannedAt);
      if (isNaN(scanDate.getTime()) || Date.now() - scanDate.getTime() > 5 * 60 * 1000) {
        return res.status(400).json({ message: 'Scan timestamp is too old to verify' });
      }
    }

    // 3. Idempotent check: if already verified, return 200 with alreadyVerified: true
    const existingProgress = await Progress.findOne({
      teamId: team._id,
      checkpointId: checkpoint._id,
    });

    if (existingProgress) {
      const allQuestCheckpoints = await Checkpoint.find({ questId: team.questId }).sort({
        order: 1,
      });
      const clearedCheckpointIds = await Progress.distinct('checkpointId', {
        teamId: team._id,
        questId: team.questId,
      });
      const clearedSet = new Set(clearedCheckpointIds.map((id) => id.toString()));

      const unlockedCheckpoints = allQuestCheckpoints
        .filter((cp) => !clearedSet.has(cp._id.toString()))
        .filter((cp) => {
          if (!cp.prerequisites || cp.prerequisites.length === 0) return true;
          return cp.prerequisites.every((pId) => clearedSet.has(pId.toString()));
        })
        .map((cp) => ({
          _id: cp._id,
          order: cp.order,
          title: cp.title,
          clue: cp.clue,
          points: cp.points,
          radius: cp.radius,
        }));

      return res.status(200).json({
        success: true,
        alreadyVerified: true,
        message: 'This checkpoint has already been verified.',
        progress: existingProgress,
        unlockedCheckpoints,
      });
    }

    // 4. Enforce prerequisite checkpoints (branching DAG paths)
    if (checkpoint.prerequisites && checkpoint.prerequisites.length > 0) {
      const clearedCount = await Progress.countDocuments({
        teamId: team._id,
        checkpointId: { $in: checkpoint.prerequisites },
      });
      if (clearedCount < checkpoint.prerequisites.length) {
        return res.status(400).json({ message: 'Prerequisite checkpoints not yet cleared.' });
      }
    }

    // 5. Enforce Mandatory GPS Proximity (Anti-Cheat, optional bypass in testing)
    const isDevBypass = process.env.BYPASS_GEOFENCE === 'true';
    if (!isDevBypass) {
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

      const guildPerks = getGuildPerks(team.score || 0);
      const baseRadius = checkpoint.radius || 50;
      const maxAllowedRadius = baseRadius + (guildPerks.bonusRadiusMeters || 0);
      // Allow slight GPS inaccuracy buffer (+25m buffer, or +50m if location is stale from offline fallback)
      const allowedWithBuffer = maxAllowedRadius + (locationStale ? 50 : 25);

      if (distance == null || distance > allowedWithBuffer) {
        return res.status(400).json({
          message: `Too far from discovery site! You are ${distance ?? 'unknown'}m away (must be within ${maxAllowedRadius}m of ${checkpoint.title}). Move closer to landmark and re-scan.`,
          distance,
          allowedRadius: maxAllowedRadius,
        });
      }
    }

    // 6. Record Progress with Guild XP Multiplier & authoritative scan timestamp
    const xpResult = calculateAwardedXp(checkpoint.points, team.score || 0);
    const effectiveScannedAt =
      scannedAt && !isNaN(new Date(scannedAt).getTime()) ? new Date(scannedAt) : new Date();

    const progress = await Progress.create({
      teamId: team._id,
      questId: team.questId,
      checkpointId: checkpoint._id,
      verifiedBy: req.user._id,
      pointsAwarded: xpResult.finalPoints,
      createdAt: effectiveScannedAt,
    });

    // 7. Update Team Score
    team.score = (team.score || 0) + xpResult.finalPoints;
    await team.save();

    // Log team activity & evaluate achievements (fire-and-forget)
    const actorName = req.user.name || 'A player';
    TeamActivity.create({
      teamId: team._id,
      actorId: req.user._id,
      type: 'checkpoint_cleared',
      message: `${actorName} cleared Checkpoint ${checkpoint.order}: ${checkpoint.title} (+${xpResult.finalPoints} XP)`,
    }).catch((actErr) => console.error('[TeamActivity Error]', actErr.message));

    evaluateAchievements(team, {
      checkpointId: checkpoint._id,
      order: checkpoint.order,
      actorId: req.user._id,
      timestamp: effectiveScannedAt,
    }).catch((achErr) => console.error('[Achievement Error]', achErr.message));

    // 8. Find newly unlocked checkpoints in sequence/branches
    const allQuestCheckpoints = await Checkpoint.find({ questId: team.questId }).sort({ order: 1 });
    const clearedCheckpointIds = await Progress.distinct('checkpointId', {
      teamId: team._id,
      questId: team.questId,
    });
    const clearedSet = new Set(clearedCheckpointIds.map((id) => id.toString()));

    const remainingCheckpoints = allQuestCheckpoints.filter(
      (cp) => !clearedSet.has(cp._id.toString())
    );

    const unlockedCheckpoints = remainingCheckpoints
      .filter((cp) => {
        if (!cp.prerequisites || cp.prerequisites.length === 0) return true;
        return cp.prerequisites.every((pId) => clearedSet.has(pId.toString()));
      })
      .map((cp) => ({
        _id: cp._id,
        order: cp.order,
        title: cp.title,
        clue: cp.clue,
        points: cp.points,
        radius: cp.radius,
      }));

    const isQuestCompleted = remainingCheckpoints.length === 0 || unlockedCheckpoints.length === 0;

    return res.status(200).json({
      success: true,
      message: `🎉 Checkpoint #${checkpoint.order} (${checkpoint.title}) successfully cleared!`,
      pointsAwarded: xpResult.finalPoints,
      bonusXp: xpResult.bonusXp,
      appliedMultiplier: xpResult.appliedMultiplier,
      guildLevel: xpResult.guildLevel,
      totalScore: team.score,
      clearedCheckpoint: {
        _id: checkpoint._id,
        title: checkpoint.title,
        order: checkpoint.order,
      },
      unlockedCheckpoints,
      isQuestCompleted,
      ...(locationStale ? { warning: 'Stale location used — verified with extended buffer' } : {}),
    });
  } catch (error) {
    if (error.code === 11000) {
      const existing = await Progress.findOne({
        teamId: team._id,
        checkpointId: checkpoint._id,
      });
      return res.status(200).json({
        success: true,
        alreadyVerified: true,
        message: 'This checkpoint has already been verified.',
        progress: existing,
        unlockedCheckpoints: [],
      });
    }
    return res
      .status(500)
      .json({ message: error.message || 'Server error during checkpoint verification' });
  }
};

// @desc    Get hints and status for a checkpoint
// @route   GET /api/checkpoints/:id/hints
// @access  Private
const getCheckpointHints = async (req, res) => {
  try {
    const team = await Team.findOne({ members: req.user._id });
    if (!team) return res.status(400).json({ message: 'Must belong to an active party.' });

    const checkpoint = await Checkpoint.findById(req.params.id);
    if (!checkpoint) return res.status(404).json({ message: 'Checkpoint not found.' });

    // Check prerequisites
    if (checkpoint.prerequisites && checkpoint.prerequisites.length > 0) {
      const clearedCount = await Progress.countDocuments({
        teamId: team._id,
        checkpointId: { $in: checkpoint.prerequisites },
      });
      if (clearedCount < checkpoint.prerequisites.length) {
        return res.status(400).json({ message: 'Prerequisite checkpoints not yet cleared.' });
      }
    }

    const reveals = await HintReveal.find({
      teamId: team._id,
      targetType: 'checkpoint',
      targetId: checkpoint._id,
    });
    const revealedIndices = new Set(reveals.map((r) => r.hintIndex));

    const hints = (checkpoint.hints || []).map((h, idx) => {
      const isRevealed = revealedIndices.has(idx);
      return {
        index: idx,
        cost: h.cost,
        text: isRevealed ? h.text : null,
        isRevealed,
      };
    });

    return res.status(200).json({
      success: true,
      hints,
      teamScore: team.score || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching hints' });
  }
};

// @desc    Unlock a hint for a checkpoint
// @route   POST /api/checkpoints/:id/hint
// @access  Private
const revealCheckpointHint = async (req, res) => {
  try {
    const { hintIndex } = req.body;
    if (hintIndex === undefined || isNaN(Number(hintIndex))) {
      return res.status(400).json({ message: 'Valid hintIndex is required.' });
    }
    const idx = Number(hintIndex);

    const team = await Team.findOne({ members: req.user._id });
    if (!team) return res.status(400).json({ message: 'Must belong to an active party.' });

    const checkpoint = await Checkpoint.findById(req.params.id);
    if (!checkpoint) return res.status(404).json({ message: 'Checkpoint not found.' });

    // 1. Check if team reached checkpoint (prerequisites satisfied)
    if (checkpoint.prerequisites && checkpoint.prerequisites.length > 0) {
      const clearedCount = await Progress.countDocuments({
        teamId: team._id,
        checkpointId: { $in: checkpoint.prerequisites },
      });
      if (clearedCount < checkpoint.prerequisites.length) {
        return res.status(400).json({ message: 'Prerequisite checkpoints not yet cleared.' });
      }
    }

    if (!checkpoint.hints || idx < 0 || idx >= checkpoint.hints.length) {
      return res.status(400).json({ message: 'Hint index out of range.' });
    }

    const hint = checkpoint.hints[idx];

    // 2. Check if already revealed
    const existingReveal = await HintReveal.findOne({
      teamId: team._id,
      targetType: 'checkpoint',
      targetId: checkpoint._id,
      hintIndex: idx,
    });

    if (existingReveal) {
      return res.status(200).json({
        success: true,
        alreadyRevealed: true,
        hint: hint.text,
        cost: 0,
        teamScore: team.score || 0,
      });
    }

    // 3. Check sufficient team score
    const currentScore = team.score || 0;
    if (currentScore < hint.cost) {
      return res.status(400).json({
        message: `Insufficient party score (${currentScore} PTS). Hint costs ${hint.cost} PTS.`,
      });
    }

    const newScore = Math.max(0, currentScore - hint.cost);
    const warning = getPerkLossWarning(currentScore, newScore);

    team.score = newScore;
    await team.save();

    await HintReveal.create({
      teamId: team._id,
      targetType: 'checkpoint',
      targetId: checkpoint._id,
      hintIndex: idx,
      revealedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      hint: hint.text,
      cost: hint.cost,
      newScore: team.score,
      warning,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error revealing hint' });
  }
};

module.exports = {
  verifyCheckpoint,
  getCheckpointHints,
  revealCheckpointHint,
};

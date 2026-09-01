const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');
const ChallengeAttempt = require('../models/ChallengeAttempt');
const Team = require('../models/Team');
const { uploadImage } = require('../utils/cloudinary');

// @desc    Get all active challenges with current team submission status
// @route   GET /api/challenges
// @access  Private
const getAllChallenges = async (req, res) => {
  try {
    const team = await Team.findOne({ members: req.user._id });
    const challenges = await Challenge.find({ status: 'active' }).sort({ points: 1 });

    let submissionsMap = {};
    if (team) {
      const submissions = await Submission.find({ teamId: team._id });
      submissions.forEach((sub) => {
        submissionsMap[sub.challengeId.toString()] = {
          _id: sub._id,
          status: sub.status,
          photoUrl: sub.photoUrl,
          textResponse: sub.textResponse,
          pointsAwarded: sub.pointsAwarded,
          feedback: sub.feedback,
          submittedAt: sub.createdAt,
        };
      });
    }

    const challengesWithStatus = challenges.map((c) => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      category: c.category,
      points: c.points,
      verificationType: c.verificationType,
      submission: submissionsMap[c._id.toString()] || null,
    }));

    return res.status(200).json({
      challenges: challengesWithStatus,
      team: team ? { _id: team._id, name: team.name, score: team.score } : null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching challenges' });
  }
};

// @desc    Get challenge details by ID
// @route   GET /api/challenges/:id
// @access  Private
const getChallengeById = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const team = await Team.findOne({ members: req.user._id });
    let submission = null;
    if (team) {
      submission = await Submission.findOne({
        challengeId: challenge._id,
        teamId: team._id,
      });
    }

    return res.status(200).json({
      challenge: {
        _id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        points: challenge.points,
        verificationType: challenge.verificationType,
        submission: submission
          ? {
              _id: submission._id,
              status: submission.status,
              photoUrl: submission.photoUrl,
              textResponse: submission.textResponse,
              pointsAwarded: submission.pointsAwarded,
              feedback: submission.feedback,
              submittedAt: submission.createdAt,
            }
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching challenge' });
  }
};

// @desc    Submit a challenge response (photo or text answer)
// @route   POST /api/challenges/:id/submit
// @access  Private
const submitChallenge = async (req, res) => {
  try {
    const { photoUrl, textResponse } = req.body;

    const team = await Team.findOne({ members: req.user._id });
    if (!team) {
      return res
        .status(400)
        .json({ message: 'You must belong to an active party to submit challenges.' });
    }

    if (team.isBanned || team.status === 'banned') {
      return res.status(403).json({
        message: `Guild "${team.name}" has been banned by the Guild Master Admin.${team.banReason ? ' Reason: ' + team.banReason : ''}`,
        isBanned: true,
      });
    }

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge || challenge.status !== 'active') {
      return res.status(404).json({ message: 'Challenge not found or no longer active.' });
    }

    // Check existing submission
    let existingSub = await Submission.findOne({
      challengeId: challenge._id,
      teamId: team._id,
    });

    if (existingSub) {
      if (existingSub.status === 'approved') {
        return res
          .status(400)
          .json({ message: 'This challenge has already been approved and rewarded!' });
      }
      if (existingSub.status === 'pending') {
        return res
          .status(400)
          .json({ message: 'Your party already has a submission pending review.' });
      }
    }

    // Handle Auto Answer (Trivia)
    if (challenge.verificationType === 'auto_answer') {
      if (!textResponse || !textResponse.trim()) {
        return res.status(400).json({ message: 'Please provide an answer.' });
      }

      const isCorrect =
        textResponse.trim().toLowerCase() === (challenge.answerKey || '').toLowerCase();

      if (!isCorrect) {
        return res.status(400).json({ message: 'Incorrect answer. Try again!' });
      }

      // Correct! Award points immediately
      if (existingSub) {
        existingSub.status = 'approved';
        existingSub.textResponse = textResponse.trim();
        existingSub.pointsAwarded = challenge.points;
        existingSub.submittedBy = req.user._id;
        existingSub.reviewedAt = new Date();
        await existingSub.save();
      } else {
        await Submission.create({
          challengeId: challenge._id,
          teamId: team._id,
          submittedBy: req.user._id,
          textResponse: textResponse.trim(),
          status: 'approved',
          pointsAwarded: challenge.points,
          reviewedAt: new Date(),
        });
      }

      team.score = (team.score || 0) + challenge.points;
      await team.save();

      return res.status(200).json({
        success: true,
        approved: true,
        pointsAwarded: challenge.points,
        totalScore: team.score,
        message: `🎉 Correct answer! +${challenge.points} Points awarded to ${team.name}!`,
      });
    }

    // Handle Manual Review (Photo / Creative / Riddle)
    if (challenge.category === 'photo' && !photoUrl) {
      return res.status(400).json({ message: 'Photo proof is required for photo challenges.' });
    }

    let hostedPhotoUrl = '';
    if (photoUrl) {
      hostedPhotoUrl = await uploadImage(photoUrl, 'quest_overworld_proofs');
    }

    if (existingSub) {
      existingSub.photoUrl = hostedPhotoUrl || existingSub.photoUrl;
      existingSub.textResponse = textResponse || existingSub.textResponse;
      existingSub.status = 'pending';
      existingSub.submittedBy = req.user._id;
      existingSub.feedback = '';
      await existingSub.save();
    } else {
      existingSub = await Submission.create({
        challengeId: challenge._id,
        teamId: team._id,
        submittedBy: req.user._id,
        photoUrl: hostedPhotoUrl || '',
        textResponse: textResponse || '',
        status: 'pending',
      });
    }

    return res.status(200).json({
      success: true,
      approved: false,
      status: 'pending',
      submission: existingSub,
      message: 'Submission received! Sent to Guild Admin for review.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error submitting challenge' });
  }
};

// ================= AUTOMATED TRIVIA / RIDDLE SOLVE (ATTEMPT CAPPED) ================= //

// Helper to compute points awarded based on attempt index (0-indexed prior to current solve)
const getPointsForAttempt = (basePoints, attemptCount) => {
  if (attemptCount === 0) return Math.round(basePoints); // Attempt 1: 100%
  if (attemptCount === 1) return Math.round(basePoints * 0.8); // Attempt 2: 80%
  return Math.round(basePoints * 0.5); // Attempt 3 & Attempt 4: 50%
};

// @desc    Get current team attempt & cooldown status for a trivia/riddle challenge
// @route   GET /api/challenges/:id/attempt-status
// @access  Private
const getChallengeAttemptStatus = async (req, res) => {
  try {
    const team = await Team.findOne({ members: req.user._id });
    if (!team) {
      return res.status(400).json({ message: 'You must belong to an active party.' });
    }

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found.' });
    }

    // Photo challenges do not use attempt caps
    if (challenge.category === 'photo' || challenge.verificationType === 'manual_review') {
      return res.status(200).json({ isCapped: false });
    }

    let attemptRecord = await ChallengeAttempt.findOne({
      teamId: team._id,
      challengeId: challenge._id,
    });

    if (!attemptRecord) {
      return res.status(200).json({
        isCapped: true,
        attempts: 0,
        maxStandardAttempts: 3,
        hasBonusRetry: true,
        usedBonusRetry: false,
        status: 'in_progress',
        isLocked: false,
        secondsRemaining: 0,
        currentPointsPreview: challenge.points,
        nextPointsPreview: getPointsForAttempt(challenge.points, 1),
      });
    }

    const now = Date.now();
    let secondsRemaining = 0;
    let isLockedByCooldown = false;

    if (attemptRecord.lockedUntil && new Date(attemptRecord.lockedUntil).getTime() > now) {
      isLockedByCooldown = true;
      secondsRemaining = Math.ceil((new Date(attemptRecord.lockedUntil).getTime() - now) / 1000);
    }

    const currentPointsPreview = getPointsForAttempt(challenge.points, attemptRecord.attempts);

    return res.status(200).json({
      isCapped: true,
      attempts: attemptRecord.attempts,
      maxStandardAttempts: 3,
      hasBonusRetry: !attemptRecord.usedBonusRetry,
      usedBonusRetry: attemptRecord.usedBonusRetry,
      status: attemptRecord.status,
      isLocked: attemptRecord.status === 'locked' || isLockedByCooldown,
      lockedUntil: attemptRecord.lockedUntil,
      secondsRemaining,
      currentPointsPreview,
      nextPointsPreview: getPointsForAttempt(challenge.points, attemptRecord.attempts + 1),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || 'Server error fetching attempt status' });
  }
};

// @desc    Solve automated trivia/riddle with decay schedule & 429 team cooldowns
// @route   POST /api/challenges/:id/solve
// @access  Private
const solveChallenge = async (req, res) => {
  try {
    const { answer } = req.body;

    const team = await Team.findOne({ members: req.user._id });
    if (!team) {
      return res
        .status(400)
        .json({ message: 'You must belong to an active party to solve bounties.' });
    }

    if (team.isBanned || team.status === 'banned') {
      return res.status(403).json({
        message: `Guild "${team.name}" has been banned by the Guild Master Admin.${team.banReason ? ' Reason: ' + team.banReason : ''}`,
        isBanned: true,
      });
    }

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge || challenge.status !== 'active') {
      return res.status(404).json({ message: 'Challenge not found or no longer active.' });
    }

    // Photo challenges must go through submit endpoint, not solve
    if (challenge.category === 'photo' || challenge.verificationType === 'manual_review') {
      return res
        .status(400)
        .json({ message: 'Photo proof challenges must be submitted with photo capture.' });
    }

    if (!answer || !answer.trim()) {
      return res.status(400).json({ message: 'Please provide an answer.' });
    }

    // Find or create team-scoped attempt record
    let attemptRecord = await ChallengeAttempt.findOne({
      teamId: team._id,
      challengeId: challenge._id,
    });

    if (!attemptRecord) {
      attemptRecord = await ChallengeAttempt.create({
        teamId: team._id,
        challengeId: challenge._id,
        attempts: 0,
        usedBonusRetry: false,
        status: 'in_progress',
      });
    }

    // 1. Check if already solved
    if (attemptRecord.status === 'solved') {
      return res
        .status(400)
        .json({ message: 'This bounty has already been cleared by your party!' });
    }

    // 2. Check if permanently locked (after 4 failed attempts)
    if (attemptRecord.status === 'locked' || attemptRecord.attempts >= 4) {
      return res.status(400).json({
        message: 'This bounty is permanently sealed for your party (all 4 attempts exhausted).',
        status: 'locked',
      });
    }

    // 3. Check active cooldown lock (429)
    const now = Date.now();
    if (attemptRecord.lockedUntil && new Date(attemptRecord.lockedUntil).getTime() > now) {
      const secondsRemaining = Math.ceil(
        (new Date(attemptRecord.lockedUntil).getTime() - now) / 1000
      );
      return res.status(429).json({
        message: `Guild party cooldown active. Please wait ${secondsRemaining}s before attempting again.`,
        lockedUntil: attemptRecord.lockedUntil,
        secondsRemaining,
        attempts: attemptRecord.attempts,
      });
    }

    // Evaluate answer string
    const normalizedInput = answer.trim().toLowerCase();
    const normalizedKey = (challenge.answerKey || '').trim().toLowerCase();
    const isCorrect = normalizedInput === normalizedKey;

    if (isCorrect) {
      // Correct! Calculate points based on current attempt number
      const awardedPoints = getPointsForAttempt(challenge.points, attemptRecord.attempts);

      attemptRecord.status = 'solved';
      attemptRecord.lockedUntil = null;
      await attemptRecord.save();

      // Create or update approved submission record
      let existingSub = await Submission.findOne({
        challengeId: challenge._id,
        teamId: team._id,
      });

      if (existingSub) {
        existingSub.status = 'approved';
        existingSub.textResponse = answer.trim();
        existingSub.pointsAwarded = awardedPoints;
        existingSub.submittedBy = req.user._id;
        existingSub.reviewedAt = new Date();
        await existingSub.save();
      } else {
        await Submission.create({
          challengeId: challenge._id,
          teamId: team._id,
          submittedBy: req.user._id,
          textResponse: answer.trim(),
          status: 'approved',
          pointsAwarded: awardedPoints,
          reviewedAt: new Date(),
        });
      }

      // Add points to team score
      team.score = (team.score || 0) + awardedPoints;
      await team.save();

      return res.status(200).json({
        success: true,
        correct: true,
        awardedPoints,
        totalScore: team.score,
        attemptsUsed: attemptRecord.attempts + 1,
        message: `🎉 Correct answer! +${awardedPoints} XP awarded to ${team.name}!`,
      });
    }

    // Incorrect answer: increment attempt count
    attemptRecord.attempts += 1;

    let cooldownSeconds = 0;
    let failureNotice = '';

    if (attemptRecord.attempts === 1) {
      // Failed Try 1: 10-second cooldown, next attempt gives 80% XP
      cooldownSeconds = 10;
      attemptRecord.lockedUntil = new Date(now + 10 * 1000);
      failureNotice = 'Incorrect answer. 10s party cooldown before Attempt 2/3 (80% XP).';
    } else if (attemptRecord.attempts === 2) {
      // Failed Try 2: 30-second cooldown, next attempt gives 50% XP
      cooldownSeconds = 30;
      attemptRecord.lockedUntil = new Date(now + 30 * 1000);
      failureNotice = 'Incorrect answer. 30s party cooldown before Attempt 3/3 (50% XP).';
    } else if (attemptRecord.attempts === 3) {
      // Failed Try 3: 3-minute cooldown before final bonus retry (50% XP)
      cooldownSeconds = 180;
      attemptRecord.lockedUntil = new Date(now + 180 * 1000);
      attemptRecord.usedBonusRetry = true;
      failureNotice = '3 Standard attempts failed. 3-minute cooldown before Final Second Chance!';
    } else {
      // Failed Try 4 (bonus retry): permanently locked
      attemptRecord.status = 'locked';
      attemptRecord.lockedUntil = null;
      failureNotice = 'Final attempt failed. This bounty is permanently sealed.';
    }

    await attemptRecord.save();

    const nextPoints = getPointsForAttempt(challenge.points, attemptRecord.attempts);

    return res.status(400).json({
      success: false,
      correct: false,
      attempts: attemptRecord.attempts,
      status: attemptRecord.status,
      lockedUntil: attemptRecord.lockedUntil,
      secondsRemaining: cooldownSeconds,
      nextPointsPreview: nextPoints,
      message: failureNotice,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error solving challenge' });
  }
};

module.exports = {
  getAllChallenges,
  getChallengeById,
  submitChallenge,
  getChallengeAttemptStatus,
  solveChallenge,
};

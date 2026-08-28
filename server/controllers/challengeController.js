const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');
const Team = require('../models/Team');

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
      return res.status(400).json({ message: 'You must belong to an active party to submit challenges.' });
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
        return res.status(400).json({ message: 'This challenge has already been approved and rewarded!' });
      }
      if (existingSub.status === 'pending') {
        return res.status(400).json({ message: 'Your party already has a submission pending review.' });
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

    if (existingSub) {
      existingSub.photoUrl = photoUrl || existingSub.photoUrl;
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
        photoUrl: photoUrl || '',
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

module.exports = {
  getAllChallenges,
  getChallengeById,
  submitChallenge,
};

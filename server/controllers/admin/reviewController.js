const { calculateAwardedXp } = require('../../utils/guildPerks');
const Submission = require('../../models/Submission');
const Team = require('../../models/Team');

const getPendingSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ status: 'pending' })
      .populate('challengeId', 'title description category points minPoints maxPoints')
      .populate('teamId', 'name code score')
      .populate('submittedBy', 'name email')
      .sort({ createdAt: 1 });

    return res.status(200).json({ submissions });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || 'Server error fetching pending submissions' });
  }
};

const approveSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('challengeId')
      .populate('teamId');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    if (submission.status === 'approved') {
      return res.status(400).json({ message: 'Submission has already been approved.' });
    }

    let pointsToAward = submission.challengeId?.points || 150;
    if (req.body.pointsAwarded != null && !isNaN(Number(req.body.pointsAwarded))) {
      pointsToAward = Math.max(1, Number(req.body.pointsAwarded));
    }

    submission.status = 'approved';
    submission.pointsAwarded = pointsToAward;
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    await submission.save();

    if (submission.teamId) {
      const team = await Team.findById(submission.teamId._id);
      if (team) {
        const xpResult = calculateAwardedXp(pointsToAward, team.score || 0);
        pointsToAward = xpResult.finalPoints;
        submission.pointsAwarded = pointsToAward;
        team.score = (team.score || 0) + pointsToAward;
        await team.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `🎉 Submission approved! +${pointsToAward} PTS awarded to party.`,
      submission,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error approving submission' });
  }
};

const rejectSubmission = async (req, res) => {
  try {
    const { feedback } = req.body;

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    submission.status = 'rejected';
    submission.feedback = feedback || 'Submission rejected by Guild Master Admin.';
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    await submission.save();

    return res.status(200).json({
      success: true,
      message: 'Submission rejected with feedback.',
      submission,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error rejecting submission' });
  }
};

module.exports = {
  getPendingSubmissions,
  approveSubmission,
  rejectSubmission,
};

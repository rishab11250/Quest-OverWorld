const User = require('../../models/User');
const Team = require('../../models/Team');
const Quest = require('../../models/Quest');
const Checkpoint = require('../../models/Checkpoint');
const Challenge = require('../../models/Challenge');
const Submission = require('../../models/Submission');
const ChallengeAttempt = require('../../models/ChallengeAttempt');

const reseedDemoData = async (req, res) => {
  try {
    // Clear demo runtime collections
    await Promise.all([Submission.deleteMany({}), ChallengeAttempt.deleteMany({})]);

    // Reset team scores
    await Team.updateMany(
      {},
      { $set: { score: 0, progress: [], currentQuest: null, currentCheckpointOrder: 1 } }
    );

    return res.status(200).json({
      success: true,
      message:
        'System runtime data cleared (submissions, challenge attempts, and party scores reset).',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error reseeding demo data' });
  }
};

module.exports = {
  reseedDemoData,
};

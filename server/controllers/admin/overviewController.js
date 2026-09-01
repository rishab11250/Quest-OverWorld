const Quest = require('../../models/Quest');
const Checkpoint = require('../../models/Checkpoint');
const Challenge = require('../../models/Challenge');
const Submission = require('../../models/Submission');
const Team = require('../../models/Team');
const User = require('../../models/User');

// @desc    Get admin dashboard stats & live metrics
// @route   GET /api/admin/overview
// @access  Private (Admin)
const getAdminOverview = async (req, res) => {
  try {
    const [
      usersCount,
      teamsCount,
      questsCount,
      checkpointsCount,
      challengesCount,
      pendingSubmissionsCount,
      approvedSubmissionsCount,
    ] = await Promise.all([
      User.countDocuments(),
      Team.countDocuments(),
      Quest.countDocuments(),
      Checkpoint.countDocuments(),
      Challenge.countDocuments(),
      Submission.countDocuments({ status: 'pending' }),
      Submission.countDocuments({ status: 'approved' }),
    ]);

    // Calculate total points earned across all teams
    const allTeams = await Team.find().select('score name code');
    const totalXpAwarded = allTeams.reduce((acc, t) => acc + (t.score || 0), 0);

    const recentQuests = await Quest.find().sort({ createdAt: -1 }).limit(5);
    const recentSubmissions = await Submission.find()
      .populate('teamId', 'name score')
      .populate('challengeId', 'title category points')
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      admin: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.isAdmin ? 'Guild Master Admin' : req.user.role || 'Admin',
        joinedAt: req.user.createdAt,
      },
      stats: {
        users: usersCount,
        teams: teamsCount,
        quests: questsCount,
        checkpoints: checkpointsCount,
        challenges: challengesCount,
        pendingSubmissions: pendingSubmissionsCount,
        approvedSubmissions: approvedSubmissionsCount,
        totalXpAwarded,
      },
      teams: allTeams,
      recentQuests,
      recentSubmissions,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || 'Server error fetching admin overview' });
  }
};

module.exports = {
  getAdminOverview,
};

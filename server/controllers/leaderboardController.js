const Team = require('../models/Team');
const Progress = require('../models/Progress');
const Submission = require('../models/Submission');

// @desc    Get real-time leaderboard rankings
// @route   GET /api/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    const userTeam = await Team.findOne({ members: req.user._id });
    const userTeamId = userTeam ? userTeam._id.toString() : null;

    // Fetch all teams sorted by score descending, then updatedAt ascending
    const teams = await Team.find({})
      .populate('members', 'name email')
      .populate('leader', 'name email')
      .sort({ score: -1, updatedAt: 1 });

    const rankings = await Promise.all(
      teams.map(async (team, index) => {
        const rank = index + 1;
        const [checkpointsCount, challengesCount] = await Promise.all([
          Progress.countDocuments({ teamId: team._id }),
          Submission.countDocuments({ teamId: team._id, status: 'approved' }),
        ]);

        const level = Math.floor((team.score || 0) / 250) + 1;
        const isCurrentTeam = userTeamId === team._id.toString();

        return {
          rank,
          _id: team._id,
          name: team.name,
          code: team.code,
          score: team.score || 0,
          level,
          membersCount: team.members?.length || 0,
          leaderName: team.leader?.name || 'Captain',
          checkpointsCount,
          challengesCount,
          isCurrentTeam,
        };
      })
    );

    const myTeam = rankings.find((r) => r.isCurrentTeam) || null;

    return res.status(200).json({
      rankings,
      myTeam,
      totalTeams: rankings.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching leaderboard' });
  }
};

module.exports = {
  getLeaderboard,
};

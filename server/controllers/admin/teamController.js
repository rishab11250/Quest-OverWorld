const Team = require('../../models/Team');
const User = require('../../models/User');

const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('leader', 'name email')
      .populate('members', 'name email status isBanned')
      .populate('questId', 'name campus status')
      .sort({ score: -1 });

    return res.status(200).json({
      success: true,
      count: teams.length,
      teams,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching teams' });
  }
};

const updateTeamStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Status must be either "active" or "banned".' });
    }

    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    team.status = status;
    team.isBanned = status === 'banned';
    if (status === 'banned') {
      team.banReason = reason || 'Guild disqualified by tournament admin.';
    } else {
      team.banReason = '';
    }
    await team.save();

    return res.status(200).json({
      success: true,
      message:
        status === 'banned'
          ? `Guild "${team.name}" banned.`
          : `Guild "${team.name}" restored to active.`,
      team,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error updating team status' });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    await User.updateMany({ team: id }, { $set: { team: null } });
    await Team.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Guild "${team.name}" disbanded and deleted.`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error deleting team' });
  }
};

module.exports = {
  getAllTeams,
  updateTeamStatus,
  deleteTeam,
};

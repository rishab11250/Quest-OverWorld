const Team = require('../models/Team');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    // Check if user is already in an active team
    const existingTeam = await Team.findOne({ members: req.user._id });
    if (existingTeam) {
      return res.status(400).json({
        message: 'You are already a member of a team. Leave your current team first.',
        teamId: existingTeam._id,
      });
    }

    const team = await Team.create({
      name: name.trim(),
      leader: req.user._id,
      members: [req.user._id],
      score: 0,
    });

    await team.populate('members', 'name email avatar');
    await team.populate('leader', 'name email avatar');

    return res.status(201).json({ team });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error creating team' });
  }
};

// @desc    Join team by 6-character code
// @route   POST /api/teams/join
// @access  Private
const joinTeam = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Team join code is required' });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check if user is already in a team
    const currentTeam = await Team.findOne({ members: req.user._id });
    if (currentTeam) {
      if (currentTeam.code === normalizedCode) {
        return res.status(400).json({ message: 'You are already in this team' });
      }
      return res.status(400).json({
        message: 'You are already a member of a team. Leave your current team first.',
      });
    }

    const team = await Team.findOne({ code: normalizedCode });
    if (!team) {
      return res.status(404).json({ message: 'No team found with this join code' });
    }

    // Add user to team members
    team.members.push(req.user._id);
    await team.save();

    await team.populate('members', 'name email avatar');
    await team.populate('leader', 'name email avatar');

    return res.status(200).json({ team });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error joining team' });
  }
};

// @desc    Get current user's team
// @route   GET /api/teams/me
// @access  Private
const getMyTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ members: req.user._id })
      .populate('members', 'name email avatar')
      .populate('leader', 'name email avatar');

    if (!team) {
      return res.status(200).json({ team: null });
    }

    return res.status(200).json({ team });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching team' });
  }
};

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Private
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'name email avatar')
      .populate('leader', 'name email avatar');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    return res.status(200).json({ team });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching team' });
  }
};

// @desc    Leave team
// @route   POST /api/teams/:id/leave
// @access  Private
const leaveTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const memberIndex = team.members.findIndex((m) => m.toString() === req.user._id.toString());

    if (memberIndex === -1) {
      return res.status(400).json({ message: 'You are not a member of this team' });
    }

    team.members.splice(memberIndex, 1);

    // If the team is now empty, delete it
    if (team.members.length === 0) {
      await Team.findByIdAndDelete(team._id);
      return res.status(200).json({ message: 'Team disbanded', team: null });
    }

    // If the leader left, reassign leader to the next remaining member
    if (team.leader.toString() === req.user._id.toString()) {
      team.leader = team.members[0];
    }

    await team.save();
    await team.populate('members', 'name email avatar');
    await team.populate('leader', 'name email avatar');

    return res.status(200).json({ message: 'Left team successfully', team });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error leaving team' });
  }
};

module.exports = {
  createTeam,
  joinTeam,
  getMyTeam,
  getTeamById,
  leaveTeam,
};

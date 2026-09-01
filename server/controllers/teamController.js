const Team = require('../models/Team');

// Helper to populate all team references
const populateTeam = (query) => {
  return query
    .populate('members', 'name email avatar')
    .populate('leader', 'name email avatar')
    .populate('viceCaptains', 'name email avatar')
    .populate('questId', 'name description difficulty xpReward');
};

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Team name is required' });
    }

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
      viceCaptains: [],
      members: [req.user._id],
      score: 0,
    });

    await populateTeam(team);

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

    team.members.push(req.user._id);
    await team.save();

    await populateTeam(team);

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
    const team = await populateTeam(Team.findOne({ members: req.user._id }));

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
    const team = await populateTeam(Team.findById(req.params.id));

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    return res.status(200).json({ team });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching team' });
  }
};

// @desc    Update team name
// @route   PUT /api/teams/:id
// @access  Private
const updateTeam = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: 'Only the party captain or admin can rename the guild' });
    }

    team.name = name.trim();
    await team.save();

    await populateTeam(team);

    return res.status(200).json({
      success: true,
      message: `Guild renamed to "${team.name}"`,
      team,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error updating team' });
  }
};

// @desc    Kick a member from the party
// @route   POST /api/teams/:id/kick/:memberId
// @access  Private (Captain or Vice-Captain)
const kickMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const requesterId = req.user._id.toString();
    const isCaptain = team.leader.toString() === requesterId || req.user.isAdmin;
    const isViceCaptain =
      team.viceCaptains && team.viceCaptains.some((vc) => vc.toString() === requesterId);

    if (!isCaptain && !isViceCaptain) {
      return res
        .status(403)
        .json({ message: 'Only party Captains and Vice-Captains can remove members' });
    }

    if (memberId === requesterId) {
      return res
        .status(400)
        .json({ message: 'Cannot kick yourself from the party. Use Leave instead.' });
    }

    // Target checks
    if (memberId === team.leader.toString()) {
      return res
        .status(400)
        .json({ message: 'The party Captain cannot be removed from the party' });
    }

    const targetIsViceCaptain =
      team.viceCaptains && team.viceCaptains.some((vc) => vc.toString() === memberId);

    if (targetIsViceCaptain && !isCaptain) {
      return res
        .status(403)
        .json({
          message: 'Vice-Captains cannot remove other Vice-Captains. Only the Captain can.',
        });
    }

    const memberIndex = team.members.findIndex((m) => m.toString() === memberId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Player is not a member of this party' });
    }

    team.members.splice(memberIndex, 1);
    if (team.viceCaptains) {
      team.viceCaptains = team.viceCaptains.filter((vc) => vc.toString() !== memberId);
    }

    await team.save();
    await populateTeam(team);

    return res.status(200).json({
      success: true,
      message: 'Adventurer removed from party',
      team,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error removing member' });
  }
};

// @desc    Promote or Demote Vice-Captain
// @route   POST /api/teams/:id/roles/vice-captain
// @access  Private (Captain only)
const setViceCaptain = async (req, res) => {
  try {
    const { memberId, action } = req.body; // action: 'promote' | 'demote'
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const requesterId = req.user._id.toString();
    const isCaptain = team.leader.toString() === requesterId || req.user.isAdmin;

    if (!isCaptain) {
      return res
        .status(403)
        .json({ message: 'Only the party Captain can appoint or demote Vice-Captains' });
    }

    if (!team.members.some((m) => m.toString() === memberId)) {
      return res.status(404).json({ message: 'Player is not a member of this party' });
    }

    if (memberId === team.leader.toString()) {
      return res.status(400).json({ message: 'The party Captain cannot be made Vice-Captain' });
    }

    if (!team.viceCaptains) team.viceCaptains = [];

    if (action === 'promote') {
      if (!team.viceCaptains.some((vc) => vc.toString() === memberId)) {
        team.viceCaptains.push(memberId);
      }
    } else if (action === 'demote') {
      team.viceCaptains = team.viceCaptains.filter((vc) => vc.toString() !== memberId);
    } else {
      return res.status(400).json({ message: 'Invalid action. Must be "promote" or "demote"' });
    }

    await team.save();
    await populateTeam(team);

    return res.status(200).json({
      success: true,
      message:
        action === 'promote'
          ? 'Adventurer promoted to Vice-Captain'
          : 'Vice-Captain demoted to Member',
      team,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error managing role' });
  }
};

// @desc    Transfer Captaincy (Old Captain becomes Vice-Captain)
// @route   POST /api/teams/:id/transfer-leadership
// @access  Private (Captain only)
const transferLeadership = async (req, res) => {
  try {
    const { newLeaderId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const requesterId = req.user._id.toString();
    const isCaptain = team.leader.toString() === requesterId || req.user.isAdmin;

    if (!isCaptain) {
      return res
        .status(403)
        .json({ message: 'Only the current Captain can transfer party leadership' });
    }

    if (!newLeaderId || !team.members.some((m) => m.toString() === newLeaderId)) {
      return res.status(400).json({ message: 'Selected player is not a member of this party' });
    }

    if (newLeaderId === team.leader.toString()) {
      return res.status(400).json({ message: 'Player is already the party Captain' });
    }

    const oldCaptainId = team.leader;

    // Set new leader
    team.leader = newLeaderId;

    // Initialize viceCaptains array if missing
    if (!team.viceCaptains) team.viceCaptains = [];

    // Remove new leader from viceCaptains if they were one
    team.viceCaptains = team.viceCaptains.filter((vc) => vc.toString() !== newLeaderId);

    // Old captain is automatically demoted to Vice-Captain!
    if (!team.viceCaptains.some((vc) => vc.toString() === oldCaptainId.toString())) {
      team.viceCaptains.push(oldCaptainId);
    }

    await team.save();
    await populateTeam(team);

    return res.status(200).json({
      success: true,
      message: 'Party leadership transferred. You are now Vice-Captain.',
      team,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || 'Server error transferring leadership' });
  }
};

// @desc    Leave team
// @route   POST /api/teams/:id/leave
// @access  Private
const leaveTeam = async (req, res) => {
  try {
    const { newLeaderId } = req.body || {};
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const requesterId = req.user._id.toString();
    const memberIndex = team.members.findIndex((m) => m.toString() === requesterId);

    if (memberIndex === -1) {
      return res.status(400).json({ message: 'You are not a member of this team' });
    }

    const isCaptain = team.leader.toString() === requesterId;

    // If Captain wants to leave and there are other members:
    if (isCaptain && team.members.length > 1) {
      if (!newLeaderId) {
        return res.status(400).json({
          message: 'As Captain, you must appoint a new Captain before leaving the party.',
          requiresTransfer: true,
        });
      }

      const validNewLeader = team.members.some(
        (m) => m.toString() === newLeaderId && m.toString() !== requesterId
      );
      if (!validNewLeader) {
        return res.status(400).json({
          message: 'Please choose a valid party member to inherit Captain status.',
          requiresTransfer: true,
        });
      }

      team.leader = newLeaderId;
      if (team.viceCaptains) {
        team.viceCaptains = team.viceCaptains.filter((vc) => vc.toString() !== newLeaderId);
      }
    }

    // Remove user from members and viceCaptains
    team.members.splice(memberIndex, 1);
    if (team.viceCaptains) {
      team.viceCaptains = team.viceCaptains.filter((vc) => vc.toString() !== requesterId);
    }

    // If team is now empty, delete it
    if (team.members.length === 0) {
      await Team.findByIdAndDelete(team._id);
      return res.status(200).json({ message: 'Party disbanded as last member left', team: null });
    }

    // If captain left and had only 1 other member, that member becomes leader
    if (isCaptain && !team.leader) {
      team.leader = team.members[0];
    }

    await team.save();
    await populateTeam(team);

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
  updateTeam,
  kickMember,
  setViceCaptain,
  transferLeadership,
  leaveTeam,
};

const User = require('../../models/User');
const Team = require('../../models/Team');

const getAllPlayers = async (req, res) => {
  try {
    const players = await User.find()
      .select('-password')
      .populate('team', 'name code score isBanned status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: players.length,
      players,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching players' });
  }
};

const updatePlayerStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Status must be either "active" or "banned".' });
    }

    const player = await User.findById(userId).select('-password');
    if (!player) return res.status(404).json({ message: 'Player not found.' });

    if (player.isAdmin && status === 'banned') {
      return res.status(403).json({ message: 'Cannot ban an Admin account.' });
    }

    player.status = status;
    player.isBanned = status === 'banned';
    if (status === 'banned') {
      player.banReason = reason || 'Violation of community guild rules.';
    } else {
      player.banReason = '';
    }
    await player.save();

    return res.status(200).json({
      success: true,
      message:
        status === 'banned'
          ? `Player ${player.name} has been banned.`
          : `Player ${player.name} unbanned.`,
      player,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || 'Server error updating player status' });
  }
};

const updatePlayerRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin, role } = req.body;

    const player = await User.findById(userId).select('-password');
    if (!player) return res.status(404).json({ message: 'Player not found.' });

    if (userId.toString() === req.user._id.toString() && isAdmin === false) {
      return res.status(403).json({ message: 'Cannot revoke your own admin rights.' });
    }

    if (isAdmin !== undefined) player.isAdmin = Boolean(isAdmin);
    if (role !== undefined) player.role = role;
    await player.save();

    return res.status(200).json({
      success: true,
      message: `Updated role for ${player.name} to ${player.isAdmin ? 'Admin' : 'Player'}.`,
      player,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error updating player role' });
  }
};

const kickPlayerFromTeam = async (req, res) => {
  try {
    const { userId } = req.params;

    const player = await User.findById(userId);
    if (!player) return res.status(404).json({ message: 'Player not found.' });
    if (!player.team) {
      return res.status(400).json({ message: 'Player is not in any team.' });
    }

    const team = await Team.findById(player.team);
    if (team) {
      team.members = team.members.filter((m) => m.toString() !== userId.toString());
      if (team.leader && team.leader.toString() === userId.toString()) {
        team.leader = team.members.length > 0 ? team.members[0] : null;
      }
      await team.save();
    }

    player.team = null;
    await player.save();

    return res.status(200).json({
      success: true,
      message: `${player.name} removed from ${team ? team.name : 'their party'}.`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error kicking player' });
  }
};

const deletePlayer = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot delete your own admin account.' });
    }

    const player = await User.findById(userId);
    if (!player) return res.status(404).json({ message: 'Player not found.' });

    if (player.team) {
      const team = await Team.findById(player.team);
      if (team) {
        team.members = team.members.filter((m) => m.toString() !== userId.toString());
        if (team.leader && team.leader.toString() === userId.toString()) {
          team.leader = team.members.length > 0 ? team.members[0] : null;
        }
        await team.save();
      }
    }

    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: `Player account "${player.name}" permanently deleted.`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error deleting player' });
  }
};

module.exports = {
  getAllPlayers,
  updatePlayerStatus,
  updatePlayerRole,
  kickPlayerFromTeam,
  deletePlayer,
};

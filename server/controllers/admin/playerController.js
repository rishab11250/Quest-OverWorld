const User = require('../../models/User');
const Team = require('../../models/Team');
const { maskEmail } = require('../../utils/maskEmail');

// Helper to mask player email for admin view without mutating mongoose doc
const formatPlayerForAdmin = (player, team = null) => {
  const playerObj =
    player && typeof player.toObject === 'function' ? player.toObject() : { ...player };
  if (playerObj.email) {
    playerObj.email = maskEmail(playerObj.email);
  }
  if (team !== undefined) {
    playerObj.team = team;
  }
  return playerObj;
};

const getAllPlayers = async (req, res) => {
  try {
    const players = await User.find()
      .select('-password -passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    const playerIds = players.map((p) => p._id);
    const teams = await Team.find({ members: { $in: playerIds } })
      .select('_id name code score isBanned status members leader')
      .lean();

    const teamMap = {};
    for (const t of teams) {
      if (Array.isArray(t.members)) {
        for (const mId of t.members) {
          teamMap[mId.toString()] = {
            _id: t._id,
            name: t.name,
            code: t.code,
            score: t.score,
            isBanned: t.isBanned,
            status: t.status,
            isLeader: t.leader && t.leader.toString() === mId.toString(),
          };
        }
      }
    }

    const transformedPlayers = players.map((player) =>
      formatPlayerForAdmin(player, teamMap[player._id.toString()] || null)
    );

    return res.status(200).json({
      success: true,
      count: transformedPlayers.length,
      players: transformedPlayers,
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

    const player = await User.findById(userId).select('-password -passwordHash');
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

    const team = await Team.findOne({ members: userId })
      .select('_id name code score isBanned status members leader')
      .lean();

    const formattedTeam = team
      ? {
          _id: team._id,
          name: team.name,
          code: team.code,
          score: team.score,
          isBanned: team.isBanned,
          status: team.status,
          isLeader: team.leader && team.leader.toString() === userId.toString(),
        }
      : null;

    return res.status(200).json({
      success: true,
      message:
        status === 'banned'
          ? `Player ${player.name} has been banned.`
          : `Player ${player.name} unbanned.`,
      player: formatPlayerForAdmin(player, formattedTeam),
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

    const player = await User.findById(userId).select('-password -passwordHash');
    if (!player) return res.status(404).json({ message: 'Player not found.' });

    if (userId.toString() === req.user._id.toString() && isAdmin === false) {
      return res.status(403).json({ message: 'Cannot revoke your own admin rights.' });
    }

    if (isAdmin !== undefined) player.isAdmin = Boolean(isAdmin);
    if (role !== undefined) player.role = role;
    await player.save();

    const team = await Team.findOne({ members: userId })
      .select('_id name code score isBanned status members leader')
      .lean();

    const formattedTeam = team
      ? {
          _id: team._id,
          name: team.name,
          code: team.code,
          score: team.score,
          isBanned: team.isBanned,
          status: team.status,
          isLeader: team.leader && team.leader.toString() === userId.toString(),
        }
      : null;

    return res.status(200).json({
      success: true,
      message: `Updated role for ${player.name} to ${player.isAdmin ? 'Admin' : 'Player'}.`,
      player: formatPlayerForAdmin(player, formattedTeam),
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

    const team = await Team.findOne({ members: userId });
    if (!team) {
      return res.status(400).json({ message: 'Player is not in any team.' });
    }

    team.members = team.members.filter((m) => m.toString() !== userId.toString());
    if (team.viceCaptains) {
      team.viceCaptains = team.viceCaptains.filter((vc) => vc.toString() !== userId.toString());
    }
    if (team.leader && team.leader.toString() === userId.toString()) {
      team.leader = team.members.length > 0 ? team.members[0] : null;
    }
    await team.save();

    return res.status(200).json({
      success: true,
      message: `${player.name} removed from ${team.name}.`,
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

    const team = await Team.findOne({ members: userId });
    if (team) {
      team.members = team.members.filter((m) => m.toString() !== userId.toString());
      if (team.viceCaptains) {
        team.viceCaptains = team.viceCaptains.filter((vc) => vc.toString() !== userId.toString());
      }
      if (team.leader && team.leader.toString() === userId.toString()) {
        team.leader = team.members.length > 0 ? team.members[0] : null;
      }
      await team.save();
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

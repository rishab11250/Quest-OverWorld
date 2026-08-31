const crypto = require('crypto');
const QRCode = require('qrcode');
const Quest = require('../models/Quest');
const Checkpoint = require('../models/Checkpoint');
const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');
const Team = require('../models/Team');
const User = require('../models/User');

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

// ================= QUEST CRUD ================= //

/**
 * Enforces the single-active-quest rule.
 * Returns the currently active quest (excluding excludeId), or null.
 */
const findOtherActiveQuest = async (excludeId = null) => {
  const query = { status: 'active' };
  if (excludeId) query._id = { $ne: excludeId };
  return Quest.findOne(query).select('_id name');
};

const getAllAdminQuests = async (req, res) => {
  try {
    const quests = await Quest.find().populate('checkpoints').sort({ createdAt: -1 });
    return res.status(200).json({ quests });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching quests' });
  }
};

const createQuest = async (req, res) => {
  try {
    const { name, description, campus, totalPoints, status } = req.body;
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required.' });
    }

    const resolvedStatus = status || 'draft';

    // Block if trying to create an immediately active quest while one already exists
    if (resolvedStatus === 'active') {
      const existingActive = await findOtherActiveQuest();
      if (existingActive) {
        return res.status(409).json({
          message: `"${existingActive.name}" is already active. End or archive it before activating a new quest.`,
          conflictQuestId: existingActive._id,
        });
      }
    }

    const quest = await Quest.create({
      name,
      description,
      campus: campus || 'Main Campus',
      totalPoints: totalPoints || 0,
      status: resolvedStatus,
    });

    return res.status(201).json({ success: true, quest });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error creating quest' });
  }
};

const updateQuest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If activating this quest, enforce single-active rule
    if (updates.status === 'active') {
      const existingActive = await findOtherActiveQuest(id);
      if (existingActive) {
        return res.status(409).json({
          message: `"${existingActive.name}" is currently active. Set it to Draft or Ended before activating another quest.`,
          conflictQuestId: existingActive._id,
        });
      }
    }

    const quest = await Quest.findByIdAndUpdate(id, updates, { new: true });
    if (!quest) return res.status(404).json({ message: 'Quest not found' });
    return res.status(200).json({ success: true, quest });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error updating quest' });
  }
};

const deleteQuest = async (req, res) => {
  try {
    const quest = await Quest.findByIdAndDelete(req.params.id);
    if (!quest) return res.status(404).json({ message: 'Quest not found' });
    await Checkpoint.deleteMany({ questId: req.params.id });
    return res
      .status(200)
      .json({ success: true, message: 'Quest and associated checkpoints deleted.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error deleting quest' });
  }
};

// ================= CHECKPOINT CRUD ================= //

const getAllAdminCheckpoints = async (req, res) => {
  try {
    const query = req.query.questId ? { questId: req.query.questId } : {};
    const checkpoints = await Checkpoint.find(query)
      .populate('questId', 'name')
      .sort({ questId: 1, order: 1 });
    return res.status(200).json({ checkpoints });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching checkpoints' });
  }
};

const createCheckpoint = async (req, res) => {
  try {
    const { questId, title, clue, latitude, longitude, radius, points, order } = req.body;
    if (
      !questId ||
      !title ||
      !clue ||
      latitude == null ||
      longitude == null ||
      order == null
    ) {
      return res.status(400).json({ message: 'Please provide all required checkpoint fields.' });
    }

    const numericOrder = Number(order);
    const existing = await Checkpoint.findOne({ questId, order: numericOrder });
    if (existing) {
      const highestCheckpoint = await Checkpoint.findOne({ questId }).sort({ order: -1 });
      const nextOrder = (highestCheckpoint?.order || 0) + 1;
      return res.status(400).json({
        message: `Station #${numericOrder} already exists ("${existing.title}"). Please use Station #${nextOrder}.`,
      });
    }

    // Auto-generate random, unpredictable crypto token (completely decoupled from order)
    const generatedToken = crypto.randomBytes(8).toString('hex');

    // Generate scannable QR Data URL image
    const qrImage = await QRCode.toDataURL(generatedToken, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    const checkpoint = await Checkpoint.create({
      questId,
      title,
      clue,
      latitude,
      longitude,
      radius: radius || 50,
      qrCode: generatedToken,
      points: points || 100,
      order: numericOrder,
    });

    // Update quest checkpoints array
    await Quest.findByIdAndUpdate(questId, { $push: { checkpoints: checkpoint._id } });

    return res.status(201).json({
      success: true,
      checkpoint,
      qrImage,
      qrToken: generatedToken,
      message: `Checkpoint station #${numericOrder} created with auto-generated QR code.`,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: `A station with this order number already exists in this quest.`,
      });
    }
    return res.status(500).json({ message: error.message || 'Server error creating checkpoint' });
  }
};

const updateCheckpoint = async (req, res) => {
  try {
    const updateData = { ...req.body };

    let generatedToken = null;
    let qrImage = null;

    if (req.body.regenerateQr) {
      generatedToken = crypto.randomBytes(8).toString('hex');
      updateData.qrCode = generatedToken;
    }

    const checkpoint = await Checkpoint.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!checkpoint) return res.status(404).json({ message: 'Checkpoint not found' });

    if (checkpoint.qrCode) {
      qrImage = await QRCode.toDataURL(checkpoint.qrCode, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
    }

    return res.status(200).json({
      success: true,
      checkpoint,
      qrImage,
      qrToken: checkpoint.qrCode,
      message: req.body.regenerateQr
        ? 'Checkpoint updated and new QR code generated.'
        : 'Checkpoint updated.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error updating checkpoint' });
  }
};

const getCheckpointQr = async (req, res) => {
  try {
    const checkpoint = await Checkpoint.findById(req.params.id);
    if (!checkpoint) return res.status(404).json({ message: 'Checkpoint not found' });

    const qrImage = await QRCode.toDataURL(checkpoint.qrCode, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    return res.status(200).json({
      success: true,
      checkpoint: {
        _id: checkpoint._id,
        title: checkpoint.title,
        order: checkpoint.order,
        qrCode: checkpoint.qrCode,
      },
      qrImage,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error generating QR code' });
  }
};

const deleteCheckpoint = async (req, res) => {
  try {
    const checkpoint = await Checkpoint.findByIdAndDelete(req.params.id);
    if (!checkpoint) return res.status(404).json({ message: 'Checkpoint not found' });
    await Quest.findByIdAndUpdate(checkpoint.questId, { $pull: { checkpoints: checkpoint._id } });
    return res.status(200).json({ success: true, message: 'Checkpoint deleted.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error deleting checkpoint' });
  }
};

// ================= CHALLENGE CRUD ================= //

const getAllAdminChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find().sort({ createdAt: -1 });
    return res.status(200).json({ challenges });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching challenges' });
  }
};

const createChallenge = async (req, res) => {
  try {
    const { title, description, category, points, status, verificationType, answerKey } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const challenge = await Challenge.create({
      title,
      description,
      category: category || 'photo',
      points: points || 150,
      status: status || 'active',
      verificationType: verificationType || 'manual_review',
      answerKey: answerKey || '',
    });

    return res.status(201).json({ success: true, challenge });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error creating challenge' });
  }
};

const updateChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    return res.status(200).json({ success: true, challenge });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error updating challenge' });
  }
};

const deleteChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndDelete(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    return res.status(200).json({ success: true, message: 'Challenge deleted.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error deleting challenge' });
  }
};

// ================= SUBMISSION REVIEW QUEUE ================= //

const getPendingSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ status: 'pending' })
      .populate('challengeId', 'title description category points')
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

    const pointsToAward = submission.challengeId?.points || 150;

    submission.status = 'approved';
    submission.pointsAwarded = pointsToAward;
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    await submission.save();

    if (submission.teamId) {
      const team = await Team.findById(submission.teamId._id);
      if (team) {
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
    submission.feedback = feedback || 'Photo proof did not meet the objective criteria.';
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    await submission.save();

    return res.status(200).json({
      success: true,
      message: 'Submission rejected. Feedback has been sent to party for resubmission.',
      submission,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error rejecting submission' });
  }
};

// ================= SYSTEM ACTIONS ================= //

const reseedDemoData = async (req, res) => {
  try {
    // Re-seed Quest
    await Quest.deleteMany({});
    await Checkpoint.deleteMany({});
    await Challenge.deleteMany({});

    const quest = await Quest.create({
      name: 'The Chronicles of Parvat Patiya',
      description:
        'An ancient urban expedition across the historic squares, trading avenues, and garden plazas of Parvat Patiya, Surat.',
      campus: 'Parvat Patiya Realm · Surat',
      totalPoints: 700,
      status: 'active',
    });

    const checkpoints = [
      {
        questId: quest._id,
        title: 'Parvat Patiya Gateway Arch',
        clue: 'Seek the grand gateway junction where the main avenue meets the eastern flyover arch. Behind the copper marker lies the secret beacon.',
        latitude: 21.1796,
        longitude: 72.8662,
        radius: 50,
        qrCode: crypto.randomBytes(8).toString('hex'),
        points: 100,
        order: 1,
      },
      {
        questId: quest._id,
        title: 'Model Town Garden Plaza',
        clue: 'Head northeast to where shady trees border the public garden square. Search near the stone seating pavilion.',
        latitude: 21.1815,
        longitude: 72.8685,
        radius: 50,
        qrCode: crypto.randomBytes(8).toString('hex'),
        points: 150,
        order: 2,
      },
      {
        questId: quest._id,
        title: 'Ambika Avenue Fountain Court',
        clue: 'Where the twin avenues cross and tree shade cools the square. Look behind the western planter wall.',
        latitude: 21.1775,
        longitude: 72.864,
        radius: 50,
        qrCode: crypto.randomBytes(8).toString('hex'),
        points: 200,
        order: 3,
      },
      {
        questId: quest._id,
        title: 'Surat Heritage Trading Vault',
        clue: 'The final sigil marks the guild hall cornerstone. Locate the inscription by the grand entrance pillar.',
        latitude: 21.183,
        longitude: 72.8635,
        radius: 50,
        qrCode: crypto.randomBytes(8).toString('hex'),
        points: 250,
        order: 4,
      },
    ];

    const createdCps = await Checkpoint.insertMany(checkpoints);
    quest.checkpoints = createdCps.map((c) => c._id);
    await quest.save();

    // Re-seed Challenges
    const sampleChallenges = [
      {
        title: 'Campus Mascot Selfie',
        description:
          'Snap a group selfie with the bronze campus griffin mascot in the main quad center.',
        category: 'photo',
        points: 150,
        status: 'active',
        verificationType: 'manual_review',
      },
      {
        title: 'Library Hidden Manuscript',
        description:
          'Solve the riddle: "I speak without a mouth and hear without ears." Locate the book titled "Chronicles of 1920" in the campus archives.',
        category: 'riddle',
        points: 200,
        status: 'active',
        verificationType: 'manual_review',
      },
      {
        title: 'Founding Year Trivia',
        description:
          'In what year was the first cornerstone of the north campus foundation building laid? (Enter 4-digit year)',
        category: 'trivia',
        points: 100,
        status: 'active',
        verificationType: 'auto_answer',
        answerKey: '1892',
      },
      {
        title: 'Guild Battle Cry',
        description: 'Write an epic 4-line adventuring cheer / rallying cry for your party.',
        category: 'creative',
        points: 250,
        status: 'active',
        verificationType: 'manual_review',
      },
    ];

    await Challenge.insertMany(sampleChallenges);

    return res.status(200).json({
      success: true,
      message: 'Demo quest (4 checkpoints) and 4 bounties reseeded successfully.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error reseeding demo data' });
  }
};

// ================= PLAYER / ADVENTURER MANAGEMENT ================= //

// @desc    Get all players with team and stats
// @route   GET /api/admin/players
// @access  Private (Admin)
const getAllPlayers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    const teams = await Team.find().select('name code score leader members');

    const players = users.map((u) => {
      const userTeam = teams.find((t) =>
        t.members.some((m) => m.toString() === u._id.toString())
      );
      const isLeader = userTeam && userTeam.leader.toString() === u._id.toString();

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        isAdmin: u.isAdmin,
        isBanned: u.isBanned || u.status === 'banned',
        status: u.status || 'active',
        banReason: u.banReason || '',
        createdAt: u.createdAt,
        team: userTeam
          ? {
              _id: userTeam._id,
              name: userTeam.name,
              code: userTeam.code,
              score: userTeam.score,
              isLeader,
            }
          : null,
      };
    });

    return res.status(200).json({ success: true, players });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching players' });
  }
};

// @desc    Update player status (active, suspended, banned)
// @route   PATCH /api/admin/players/:userId/status
// @access  Private (Admin)
const updatePlayerStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, banReason } = req.body;

    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be active, suspended, or banned.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Protect Arch-Master from banning themselves
    if (user._id.toString() === req.user._id.toString() && status === 'banned') {
      return res.status(400).json({ message: 'You cannot ban your own administrator account.' });
    }

    user.status = status;
    user.isBanned = status === 'banned';
    user.banReason = status === 'banned' ? (banReason || 'Administrative penalty') : '';

    await user.save();

    return res.status(200).json({
      success: true,
      message: `Player status updated to ${status}.`,
      player: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        isBanned: user.isBanned,
        banReason: user.banReason,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error updating player status' });
  }
};

// @desc    Toggle player admin role
// @route   PATCH /api/admin/players/:userId/role
// @access  Private (Admin)
const updatePlayerRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Player not found' });
    }

    if (user._id.toString() === req.user._id.toString() && !isAdmin) {
      return res.status(400).json({ message: 'You cannot revoke your own administrator privileges.' });
    }

    user.isAdmin = !!isAdmin;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Player ${user.name} is now ${user.isAdmin ? 'an Administrator' : 'a Standard Adventurer'}.`,
      player: {
        _id: user._id,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error updating player role' });
  }
};

// @desc    Kick player from team
// @route   POST /api/admin/players/:userId/kick
// @access  Private (Admin)
const kickPlayerFromTeam = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Player not found' });
    }

    const team = await Team.findOne({ members: userId });
    if (!team) {
      return res.status(400).json({ message: 'Player is not in any team.' });
    }

    team.members = team.members.filter((m) => m.toString() !== userId.toString());

    if (team.members.length === 0) {
      await Team.findByIdAndDelete(team._id);
    } else {
      if (team.leader.toString() === userId.toString()) {
        team.leader = team.members[0];
      }
      await team.save();
    }

    return res.status(200).json({
      success: true,
      message: `Player ${user.name} has been removed from party ${team.name}.`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error kicking player' });
  }
};

// @desc    Permanently delete a player from database (ONLY if banned)
// @route   DELETE /api/admin/players/:userId
// @access  Private (Admin)
const deletePlayer = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent Arch-Master from deleting own account
    if (userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own administrator account.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Security: Only banned players can be permanently deleted
    if (!user.isBanned && user.status !== 'banned') {
      return res.status(400).json({
        message: 'Only banned players can be removed from the database. Please ban the player first before deleting.',
      });
    }

    // Unlink player from any teams
    const teams = await Team.find({ members: userId });
    for (const team of teams) {
      team.members = team.members.filter((m) => m.toString() !== userId.toString());
      if (team.members.length === 0) {
        await Team.findByIdAndDelete(team._id);
      } else {
        if (team.leader.toString() === userId.toString()) {
          team.leader = team.members[0];
        }
        await team.save();
      }
    }

    // Delete player from database
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: `Player "${user.name}" has been permanently deleted.`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error deleting player' });
  }
};

// @desc    Get all teams/guilds with members, leader, quest, and status
// @route   GET /api/admin/teams
// @access  Private (Admin only)
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find({})
      .populate('leader', 'name email status isBanned')
      .populate('members', 'name email status isBanned')
      .populate('questId', 'name campus totalPoints')
      .sort({ score: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      teams,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching teams' });
  }
};

// @desc    Ban or unban a guild/team
// @route   PATCH /api/admin/teams/:id/status
// @access  Private (Admin only)
const updateTeamStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, banReason = '' } = req.body;

    if (!['active', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be active or banned.' });
    }

    const isBanned = status === 'banned';
    const team = await Team.findByIdAndUpdate(
      id,
      {
        status,
        isBanned,
        bannedAt: isBanned ? new Date() : null,
        banReason: isBanned ? banReason : '',
      },
      { new: true }
    )
      .populate('leader', 'name email')
      .populate('members', 'name email')
      .populate('questId', 'name campus');

    if (!team) {
      return res.status(404).json({ message: 'Guild not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Guild "${team.name}" has been ${isBanned ? 'banned' : 'unbanned'}.`,
      team,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error updating guild status' });
  }
};

// @desc    Disband / remove a guild/team
// @route   DELETE /api/admin/teams/:id
// @access  Private (Admin only)
const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false, reason = '' } = req.body || {};
    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({ message: 'Guild not found.' });
    }

    // Unlink all members from this team in User collection
    await User.updateMany({ teamId: team._id }, { $unset: { teamId: '' } });

    if (permanent === true || req.query.permanent === 'true') {
      await Team.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: `Guild "${team.name}" permanently purged.`,
      });
    }

    // Soft disband: retain record for admin auditing & disband list
    team.status = 'disbanded';
    team.isDisbanded = true;
    team.disbandedAt = new Date();
    team.disbandReason = reason || 'Disbanded by Guild Master Admin';
    team.members = [];
    await team.save();

    return res.status(200).json({
      success: true,
      message: `Guild "${team.name}" has been disbanded and moved to Disbanded records.`,
      team,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error disbanding guild' });
  }
};

module.exports = {
  getAdminOverview,
  getAllAdminQuests,
  createQuest,
  updateQuest,
  deleteQuest,
  getAllAdminCheckpoints,
  createCheckpoint,
  updateCheckpoint,
  getCheckpointQr,
  deleteCheckpoint,
  getAllAdminChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  getPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  reseedDemoData,
  getAllPlayers,
  updatePlayerStatus,
  updatePlayerRole,
  kickPlayerFromTeam,
  deletePlayer,
  getAllTeams,
  updateTeamStatus,
  deleteTeam,
};

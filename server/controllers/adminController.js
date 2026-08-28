const Quest = require('../models/Quest');
const Checkpoint = require('../models/Checkpoint');
const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');
const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Get admin dashboard stats
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
    ] = await Promise.all([
      User.countDocuments(),
      Team.countDocuments(),
      Quest.countDocuments(),
      Checkpoint.countDocuments(),
      Challenge.countDocuments(),
      Submission.countDocuments({ status: 'pending' }),
    ]);

    const recentQuests = await Quest.find().sort({ createdAt: -1 }).limit(5);
    const recentSubmissions = await Submission.find({ status: 'pending' })
      .populate('teamId', 'name')
      .populate('challengeId', 'title category points')
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      stats: {
        users: usersCount,
        teams: teamsCount,
        quests: questsCount,
        checkpoints: checkpointsCount,
        challenges: challengesCount,
        pendingSubmissions: pendingSubmissionsCount,
      },
      recentQuests,
      recentSubmissions,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching admin overview' });
  }
};

// ================= QUEST CRUD ================= //

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

    const quest = await Quest.create({
      name,
      description,
      campus: campus || 'Main Campus',
      totalPoints: totalPoints || 0,
      status: status || 'active',
    });

    return res.status(201).json({ success: true, quest });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error creating quest' });
  }
};

const updateQuest = async (req, res) => {
  try {
    const quest = await Quest.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
    return res.status(200).json({ success: true, message: 'Quest and associated checkpoints deleted.' });
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
    const { questId, title, clue, latitude, longitude, radius, qrCode, points, order } = req.body;
    if (!questId || !title || !clue || latitude == null || longitude == null || !qrCode || order == null) {
      return res.status(400).json({ message: 'Please provide all required checkpoint fields.' });
    }

    const checkpoint = await Checkpoint.create({
      questId,
      title,
      clue,
      latitude,
      longitude,
      radius: radius || 50,
      qrCode,
      points: points || 100,
      order,
    });

    // Update quest checkpoints array
    await Quest.findByIdAndUpdate(questId, { $push: { checkpoints: checkpoint._id } });

    return res.status(201).json({ success: true, checkpoint });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error creating checkpoint' });
  }
};

const updateCheckpoint = async (req, res) => {
  try {
    const checkpoint = await Checkpoint.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!checkpoint) return res.status(404).json({ message: 'Checkpoint not found' });
    return res.status(200).json({ success: true, checkpoint });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error updating checkpoint' });
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

module.exports = {
  getAdminOverview,
  getAllAdminQuests,
  createQuest,
  updateQuest,
  deleteQuest,
  getAllAdminCheckpoints,
  createCheckpoint,
  updateCheckpoint,
  deleteCheckpoint,
  getAllAdminChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
};

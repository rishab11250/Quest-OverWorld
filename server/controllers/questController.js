const Quest = require('../models/Quest');
const Checkpoint = require('../models/Checkpoint');
const Team = require('../models/Team');
const Progress = require('../models/Progress');

// @desc    Get all active quests
// @route   GET /api/quests
// @access  Private
const getAllQuests = async (req, res) => {
  try {
    const quests = await Quest.find({ status: 'active' }).select(
      'name description campus totalPoints checkpoints status'
    );
    return res.status(200).json({ quests });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching quests' });
  }
};

// @desc    Get active quest for user's team with server-authoritative clue delivery
// @route   GET /api/quests/active
// @access  Private
const getActiveQuest = async (req, res) => {
  try {
    const team = await Team.findOne({ members: req.user._id });
    if (!team) {
      return res.status(200).json({
        quest: null,
        message: 'Join or create a party to access quests.',
      });
    }

    let quest = null;
    if (team.questId) {
      quest = await Quest.findById(team.questId);
    }

    // Default to the first active quest if not specifically bound
    if (!quest) {
      const activeQuests = await Quest.find({ status: 'active' }).select('_id name').lean();

      // Data integrity warning: should never be more than one active quest
      if (activeQuests.length > 1) {
        console.warn(
          `[WARN] single-active-quest violation: ${activeQuests.length} active quests found — ` +
            activeQuests.map((q) => `"${q.name}" (${q._id})`).join(', ') +
            '. Routing to first. Fix via admin dashboard.'
        );
      }

      quest = activeQuests[0] ? await Quest.findById(activeQuests[0]._id) : null;
      if (quest) {
        team.questId = quest._id;
        await team.save();
      }
    }

    if (!quest) {
      return res.status(200).json({ quest: null, message: 'No active quest found.' });
    }

    // Fetch all checkpoints in sequence order
    const allCheckpoints = await Checkpoint.find({ questId: quest._id }).sort({ order: 1 });

    // Determine team progress from the actual Progress collection
    const completedProgress = await Progress.find({
      teamId: team._id,
      questId: quest._id,
    }).select('checkpointId');

    const completedIds = new Set(completedProgress.map((p) => p.checkpointId.toString()));

    let completedCheckpoints = [];
    let currentOrder = 1;

    for (const cp of allCheckpoints) {
      if (completedIds.has(cp._id.toString())) {
        completedCheckpoints.push({
          _id: cp._id,
          title: cp.title,
          points: cp.points,
          order: cp.order,
          completed: true,
        });
        currentOrder = cp.order + 1;
      } else {
        break;
      }
    }

    const currentCheckpoint = allCheckpoints.find((cp) => cp.order === currentOrder);
    const isQuestCompleted = currentOrder > allCheckpoints.length;

    return res.status(200).json({
      quest: {
        _id: quest._id,
        name: quest.name,
        description: quest.description,
        campus: quest.campus,
        totalPoints: quest.totalPoints,
        totalCheckpoints: allCheckpoints.length,
        currentOrder,
        isCompleted: isQuestCompleted,
        currentClue: currentCheckpoint
          ? {
              _id: currentCheckpoint._id,
              order: currentCheckpoint.order,
              title: currentCheckpoint.title,
              clue: currentCheckpoint.clue,
              points: currentCheckpoint.points,
              radius: currentCheckpoint.radius,
            }
          : null,
        completedCheckpoints,
        checkpoints: allCheckpoints.map((cp) => ({
          _id: cp._id,
          order: cp.order,
          title: cp.title,
          points: cp.points,
          latitude: cp.latitude,
          longitude: cp.longitude,
        })),
      },
      team: {
        _id: team._id,
        name: team.name,
        score: team.score,
        code: team.code,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching active quest' });
  }
};

// @desc    Get quest by ID
// @route   GET /api/quests/:id
// @access  Private
const getQuestById = async (req, res) => {
  try {
    const quest = await Quest.findById(req.params.id);
    if (!quest) {
      return res.status(404).json({ message: 'Quest not found' });
    }

    const checkpoints = await Checkpoint.find({ questId: quest._id })
      .sort({ order: 1 })
      .select('title clue points order radius');

    return res.status(200).json({
      quest: {
        _id: quest._id,
        name: quest.name,
        description: quest.description,
        campus: quest.campus,
        totalPoints: quest.totalPoints,
        checkpoints,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching quest' });
  }
};

// @desc    Bind team to quest
// @route   POST /api/quests/:id/join
// @access  Private
const joinQuest = async (req, res) => {
  try {
    const quest = await Quest.findById(req.params.id);
    if (!quest) {
      return res.status(404).json({ message: 'Quest not found' });
    }

    const team = await Team.findOne({ members: req.user._id });
    if (!team) {
      return res.status(400).json({ message: 'You must join or create a team first.' });
    }

    team.questId = quest._id;
    await team.save();

    return res.status(200).json({ message: 'Joined quest successfully', questId: quest._id });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error joining quest' });
  }
};

module.exports = {
  getAllQuests,
  getActiveQuest,
  getQuestById,
  joinQuest,
};

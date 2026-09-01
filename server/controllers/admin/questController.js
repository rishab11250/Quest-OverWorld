const Quest = require('../../models/Quest');
const Checkpoint = require('../../models/Checkpoint');

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

    const requestedStatus = status || 'active';

    if (requestedStatus === 'active') {
      const otherActive = await findOtherActiveQuest();
      if (otherActive) {
        return res.status(409).json({
          message: `Only one quest can be active at a time. "${otherActive.name}" is already active. Please set it to draft or archived first.`,
          activeQuest: { _id: otherActive._id, name: otherActive.name },
        });
      }
    }

    const quest = await Quest.create({
      name,
      description,
      campus: campus || 'Main Campus',
      totalPoints: totalPoints || 700,
      status: requestedStatus,
      createdBy: req.user._id,
      checkpoints: [],
    });

    return res.status(201).json({ success: true, quest });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error creating quest' });
  }
};

const updateQuest = async (req, res) => {
  try {
    const { name, description, campus, totalPoints, status } = req.body;

    if (status === 'active') {
      const otherActive = await findOtherActiveQuest(req.params.id);
      if (otherActive) {
        return res.status(409).json({
          message: `Only one quest can be active at a time. "${otherActive.name}" is already active. Please set it to draft or archived first.`,
          activeQuest: { _id: otherActive._id, name: otherActive.name },
        });
      }
    }

    const quest = await Quest.findByIdAndUpdate(
      req.params.id,
      { name, description, campus, totalPoints, status },
      { new: true }
    ).populate('checkpoints');

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

    // Cascade delete associated checkpoints
    await Checkpoint.deleteMany({ questId: req.params.id });

    return res
      .status(200)
      .json({ success: true, message: 'Quest and associated checkpoints deleted.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error deleting quest' });
  }
};

module.exports = {
  findOtherActiveQuest,
  getAllAdminQuests,
  createQuest,
  updateQuest,
  deleteQuest,
};

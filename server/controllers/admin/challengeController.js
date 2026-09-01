const Challenge = require('../../models/Challenge');

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
    const {
      title,
      description,
      category,
      points,
      minPoints,
      maxPoints,
      status,
      verificationType,
      answerKey,
    } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const challenge = await Challenge.create({
      title,
      description,
      category: category || 'photo',
      points: Number(points) || Number(maxPoints) || 150,
      minPoints: Number(minPoints) || 50,
      maxPoints: Number(maxPoints) || Number(points) || 200,
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
  getAllAdminChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
};

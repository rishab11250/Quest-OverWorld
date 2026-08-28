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
    const { questId, title, clue, latitude, longitude, radius, qrCode, points, order } = req.body;
    if (
      !questId ||
      !title ||
      !clue ||
      latitude == null ||
      longitude == null ||
      !qrCode ||
      order == null
    ) {
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
      name: 'The Legend of Old Campus',
      description:
        'Journey across landmark halls, statues, and ancient clocktowers to uncover the founding lore of Old Campus.',
      campus: 'North Quadrant Campus',
      totalPoints: 700,
      status: 'active',
    });

    const checkpoints = [
      {
        questId: quest._id,
        title: 'The Great Oak of 1890',
        clue: 'Seek the oldest living guardian of North Lawn where founding scholars met.',
        latitude: 28.5458,
        longitude: 77.1926,
        radius: 50,
        qrCode: 'QST-CHK-01-OAK',
        points: 100,
        order: 1,
      },
      {
        questId: quest._id,
        title: 'Belfry of the Grand Clock',
        clue: 'Look to the high tower that chimes each hour without fail.',
        latitude: 28.5465,
        longitude: 77.1932,
        radius: 50,
        qrCode: 'QST-CHK-02-CLOCK',
        points: 150,
        order: 2,
      },
      {
        questId: quest._id,
        title: 'Wisdom Fountain Plaza',
        clue: 'Where fresh water flows in stone circles before the grand hall.',
        latitude: 28.5472,
        longitude: 77.1918,
        radius: 50,
        qrCode: 'QST-CHK-03-FOUNTAIN',
        points: 200,
        order: 3,
      },
      {
        questId: quest._id,
        title: 'Founders Memorial Hall',
        clue: 'The bronze plaque engraved with the names of the original arch-guild masters.',
        latitude: 28.548,
        longitude: 77.194,
        radius: 50,
        qrCode: 'QST-CHK-04-FOUNDERS',
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
  getPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  reseedDemoData,
};

const mongoose = require('mongoose');
const Quest = require('../../models/Quest');
const Checkpoint = require('../../models/Checkpoint');
const Challenge = require('../../models/Challenge');
const Team = require('../../models/Team');
const QuestResult = require('../../models/QuestResult');

/**
 * Helper to resolve the target quest: uses provided questId query param,
 * falls back to currently active quest, then most recently created quest.
 */
const resolveQuest = async (questId) => {
  if (questId && mongoose.Types.ObjectId.isValid(questId)) {
    return Quest.findById(questId);
  }
  const active = await Quest.findOne({ status: 'active' });
  if (active) return active;
  return Quest.findOne().sort({ createdAt: -1 });
};

// @desc    Get post-event analytics for checkpoints in a quest
// @route   GET /api/admin/analytics/checkpoints
// @access  Admin
const getCheckpointAnalytics = async (req, res) => {
  try {
    const quest = await resolveQuest(req.query.questId);
    if (!quest) {
      return res.status(200).json({
        success: true,
        quest: null,
        checkpoints: [],
        summary: {
          totalTeams: 0,
          completionRate: 0,
          longestBottleneckCheckpoint: null,
        },
      });
    }

    const questObjectId = quest._id;
    const questStartTime = quest.startAt || quest.createdAt || new Date();

    // Total teams participating in or assigned to quest
    const totalTeamsAssigned = await Team.countDocuments({ questId: questObjectId });
    const distinctTeamsWithProgress = await mongoose.connection.db
      .collection('progresses')
      .distinct('teamId', { questId: questObjectId });
    const totalTeams = Math.max(totalTeamsAssigned, distinctTeamsWithProgress.length);

    const checkpointStats = await Checkpoint.aggregate([
      { $match: { questId: questObjectId } },
      { $sort: { order: 1 } },
      {
        $lookup: {
          from: 'progresses',
          let: { chkId: '$_id', prereqIds: { $ifNull: ['$prerequisites', []] } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$checkpointId', '$$chkId'] },
              },
            },
            {
              $lookup: {
                from: 'progresses',
                let: { tId: '$teamId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$teamId', '$$tId'] },
                          { $in: ['$checkpointId', '$$prereqIds'] },
                        ],
                      },
                    },
                  },
                ],
                as: 'prereqProgress',
              },
            },
            {
              $lookup: {
                from: 'teams',
                localField: 'teamId',
                foreignField: '_id',
                as: 'teamDoc',
              },
            },
            {
              $project: {
                teamId: 1,
                verifiedAt: { $ifNull: ['$verifiedAt', '$createdAt'] },
                teamCreatedAt: { $arrayElemAt: ['$teamDoc.createdAt', 0] },
                maxPrereqVerifiedAt: {
                  $max: {
                    $map: {
                      input: '$prereqProgress',
                      as: 'pp',
                      in: { $ifNull: ['$$pp.verifiedAt', '$$pp.createdAt'] },
                    },
                  },
                },
              },
            },
            {
              $project: {
                teamId: 1,
                timeToClearSeconds: {
                  $let: {
                    vars: {
                      startTime: {
                        $cond: {
                          if: { $gt: [{ $size: '$$prereqIds' }, 0] },
                          then: '$maxPrereqVerifiedAt',
                          else: { $ifNull: [questStartTime, '$teamCreatedAt'] },
                        },
                      },
                    },
                    in: {
                      $cond: {
                        if: { $and: ['$$startTime', '$verifiedAt'] },
                        then: {
                          $max: [
                            0,
                            {
                              $divide: [{ $subtract: ['$verifiedAt', '$$startTime'] }, 1000],
                            },
                          ],
                        },
                        else: null,
                      },
                    },
                  },
                },
              },
            },
          ],
          as: 'clearances',
        },
      },
      {
        $lookup: {
          from: 'progresses',
          let: { prereqIds: { $ifNull: ['$prerequisites', []] } },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$checkpointId', '$$prereqIds'] },
              },
            },
            {
              $group: {
                _id: '$teamId',
                clearedPrereqs: { $sum: 1 },
              },
            },
            {
              $match: {
                $expr: { $gte: ['$clearedPrereqs', { $size: '$$prereqIds' }] },
              },
            },
          ],
          as: 'eligibleTeams',
        },
      },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ['$title', '$name'] },
          order: 1,
          prerequisites: { $ifNull: ['$prerequisites', []] },
          teamsCleared: { $size: '$clearances' },
          avgTimeToClearSeconds: {
            $round: [{ $ifNull: [{ $avg: '$clearances.timeToClearSeconds' }, 0] }, 1],
          },
          prevStepClearedCount: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ['$prerequisites', []] } }, 0] },
              then: { $size: '$eligibleTeams' },
              else: totalTeams,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          order: 1,
          prerequisites: 1,
          teamsCleared: 1,
          avgTimeToClearSeconds: 1,
          dropOffRate: {
            $round: [
              {
                $cond: {
                  if: { $gt: ['$prevStepClearedCount', 0] },
                  then: {
                    $max: [
                      0,
                      {
                        $multiply: [
                          {
                            $divide: [
                              { $subtract: ['$prevStepClearedCount', '$teamsCleared'] },
                              '$prevStepClearedCount',
                            ],
                          },
                          100,
                        ],
                      },
                    ],
                  },
                  else: 0,
                },
              },
              1,
            ],
          },
        },
      },
    ]);

    // Find longest bottleneck checkpoint (max avgTimeToClearSeconds)
    let longestBottleneck = null;
    let maxTime = -1;
    for (const cp of checkpointStats) {
      if (cp.avgTimeToClearSeconds > maxTime && cp.teamsCleared > 0) {
        maxTime = cp.avgTimeToClearSeconds;
        longestBottleneck = {
          _id: cp._id,
          name: cp.name,
          order: cp.order,
          avgTimeToClearSeconds: cp.avgTimeToClearSeconds,
        };
      }
    }

    // Determine completion rate:
    // Check QuestResult records first, fallback to teams that cleared all terminal checkpoints
    let completedCount = 0;
    const completedResultsCount = await QuestResult.countDocuments({
      questId: questObjectId,
    });

    if (completedResultsCount > 0) {
      completedCount = completedResultsCount;
    } else if (checkpointStats.length > 0 && totalTeams > 0) {
      // Terminal checkpoints are checkpoints that are never prerequisites of any other checkpoint
      const prereqSet = new Set();
      checkpointStats.forEach((c) => {
        (c.prerequisites || []).forEach((pId) => prereqSet.add(pId.toString()));
      });
      const terminalCheckpoints = checkpointStats.filter((c) => !prereqSet.has(c._id.toString()));
      const targetTerminalIds =
        terminalCheckpoints.length > 0
          ? terminalCheckpoints.map((t) => t._id)
          : [checkpointStats[checkpointStats.length - 1]._id];

      const teamsClearingTerminal = await mongoose.connection.db
        .collection('progresses')
        .aggregate([
          {
            $match: {
              questId: questObjectId,
              checkpointId: { $in: targetTerminalIds },
            },
          },
          {
            $group: {
              _id: '$teamId',
              terminalClears: { $sum: 1 },
            },
          },
          {
            $match: {
              terminalClears: { $gte: targetTerminalIds.length },
            },
          },
        ])
        .toArray();

      completedCount = teamsClearingTerminal.length;
    }

    const completionRate =
      totalTeams > 0 ? Math.min(100, Math.round((completedCount / totalTeams) * 100)) : 0;

    return res.status(200).json({
      success: true,
      quest: {
        _id: quest._id,
        name: quest.name,
        status: quest.status,
      },
      checkpoints: checkpointStats,
      summary: {
        totalTeams,
        completedTeams: completedCount,
        completionRate,
        longestBottleneckCheckpoint: longestBottleneck,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || 'Server error fetching checkpoint analytics' });
  }
};

// @desc    Get post-event analytics for challenges in a quest
// @route   GET /api/admin/analytics/challenges
// @access  Admin
const getChallengeAnalytics = async (req, res) => {
  try {
    const quest = await resolveQuest(req.query.questId);
    let matchFilter = {};

    if (quest && quest.specialChallenges && quest.specialChallenges.length > 0) {
      matchFilter = { _id: { $in: quest.specialChallenges } };
    } else {
      // Default to active challenges
      matchFilter = { status: 'active' };
    }

    const challengeStats = await Challenge.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'challengeattempts',
          localField: '_id',
          foreignField: 'challengeId',
          as: 'attempts',
        },
      },
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'challengeId',
          as: 'submissions',
        },
      },
      {
        $lookup: {
          from: 'hintreveals',
          let: { chId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$targetType', 'challenge'] }, { $eq: ['$targetId', '$$chId'] }],
                },
              },
            },
          ],
          as: 'revealedHints',
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          category: 1,
          points: 1,
          totalAttempts: {
            $add: [{ $ifNull: [{ $sum: '$attempts.attempts' }, 0] }, { $size: '$submissions' }],
          },
          totalTeamsAttempted: {
            $add: [
              { $size: '$attempts' },
              {
                $size: {
                  $setDifference: ['$submissions.teamId', { $ifNull: ['$attempts.teamId', []] }],
                },
              },
            ],
          },
          solvedAttempts: {
            $filter: {
              input: '$attempts',
              as: 'a',
              cond: { $eq: ['$$a.status', 'solved'] },
            },
          },
          approvedSubmissions: {
            $filter: {
              input: '$submissions',
              as: 's',
              cond: { $eq: ['$$s.status', 'approved'] },
            },
          },
          firstTrySuccesses: {
            $size: {
              $filter: {
                input: '$attempts',
                as: 'a',
                cond: {
                  $and: [{ $eq: ['$$a.status', 'solved'] }, { $eq: ['$$a.attempts', 1] }],
                },
              },
            },
          },
          hintsRevealedCount: { $size: '$revealedHints' },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          category: 1,
          points: 1,
          totalAttempts: 1,
          totalTeamsAttempted: 1,
          hintsRevealedCount: 1,
          firstTrySuccessRate: {
            $round: [
              {
                $cond: {
                  if: { $gt: ['$totalTeamsAttempted', 0] },
                  then: {
                    $multiply: [{ $divide: ['$firstTrySuccesses', '$totalTeamsAttempted'] }, 100],
                  },
                  else: 0,
                },
              },
              1,
            ],
          },
          finalPassRate: {
            $round: [
              {
                $cond: {
                  if: { $gt: ['$totalTeamsAttempted', 0] },
                  then: {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $add: [{ $size: '$solvedAttempts' }, { $size: '$approvedSubmissions' }],
                          },
                          '$totalTeamsAttempted',
                        ],
                      },
                      100,
                    ],
                  },
                  else: 0,
                },
              },
              1,
            ],
          },
          avgAttemptsBeforeSolve: {
            $round: [
              {
                $cond: {
                  if: { $gt: [{ $size: '$solvedAttempts' }, 0] },
                  then: { $avg: '$solvedAttempts.attempts' },
                  else: 0,
                },
              },
              1,
            ],
          },
        },
      },
    ]);

    // Find hardest challenge: lowest finalPassRate, or highest avg attempts before solve
    let hardestChallenge = null;
    let minPassRate = Infinity;
    for (const ch of challengeStats) {
      if (ch.totalTeamsAttempted > 0 && ch.finalPassRate < minPassRate) {
        minPassRate = ch.finalPassRate;
        hardestChallenge = {
          _id: ch._id,
          title: ch.title,
          category: ch.category,
          finalPassRate: ch.finalPassRate,
          avgAttemptsBeforeSolve: ch.avgAttemptsBeforeSolve,
        };
      }
    }

    return res.status(200).json({
      success: true,
      quest: quest
        ? {
            _id: quest._id,
            name: quest.name,
            status: quest.status,
          }
        : null,
      challenges: challengeStats,
      summary: {
        totalChallenges: challengeStats.length,
        hardestChallenge,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || 'Server error fetching challenge analytics' });
  }
};

module.exports = {
  getCheckpointAnalytics,
  getChallengeAnalytics,
};

const mongoose = require('mongoose');
const Progress = require('../models/Progress');
const Team = require('../models/Team');
const Quest = require('../models/Quest');
const QuestResult = require('../models/QuestResult');

/**
 * Finalizes and snapshots final standings for a completed quest.
 * Option 2 Chosen: finalScore is calculated from checkpoint Progress pointsAwarded,
 * with explicit scoreBreakdown labeling challenges as 'not tracked per-quest'.
 */
const finalizeQuestResults = async (questId) => {
  try {
    if (!questId) return [];

    const quest = await Quest.findById(questId);
    if (!quest) {
      console.warn(`[finalizeQuestResults] Quest not found: ${questId}`);
      return [];
    }

    // Find all teams that participated in this quest
    const participatingTeamIds = await Progress.distinct('teamId', { questId });
    if (!participatingTeamIds || participatingTeamIds.length === 0) {
      console.log(
        `[finalizeQuestResults] No participating teams with progress for quest "${quest.name}" (${questId}).`
      );
      return [];
    }

    const teams = await Team.find({ _id: { $in: participatingTeamIds } });
    const teamMap = new Map(teams.map((t) => [t._id.toString(), t]));

    // Aggregate total pointsAwarded and checkpointsCleared per team for this quest
    const qObjectId = typeof questId === 'string' ? new mongoose.Types.ObjectId(questId) : questId;

    const teamProgressAgg = await Progress.aggregate([
      { $match: { questId: qObjectId } },
      {
        $group: {
          _id: '$teamId',
          totalPoints: { $sum: '$pointsAwarded' },
          checkpointsCount: { $sum: 1 },
        },
      },
    ]);

    // Build standings data
    const standings = [];
    for (const item of teamProgressAgg) {
      const teamIdStr = item._id.toString();
      const team = teamMap.get(teamIdStr);
      if (!team) continue;

      standings.push({
        questId: quest._id,
        teamId: team._id,
        teamName: team.name,
        finalScore: item.totalPoints || 0,
        checkpointsCleared: item.checkpointsCount || 0,
        challengesCleared: 0,
        scoreBreakdown: {
          checkpoints: item.totalPoints || 0,
          challenges: 'not tracked per-quest',
        },
        completedAt: quest.endAt || new Date(),
      });
    }

    // Sort descending by score to assign finalRank
    standings.sort((a, b) => b.finalScore - a.finalScore);
    standings.forEach((entry, idx) => {
      entry.finalRank = idx + 1;
    });

    // Bulk upsert into QuestResult (idempotent)
    const operations = standings.map((entry) => ({
      updateOne: {
        filter: { questId: entry.questId, teamId: entry.teamId },
        update: { $set: entry },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await QuestResult.bulkWrite(operations);
      console.log(
        `[finalizeQuestResults] Successfully snapshotted ${standings.length} team standings for quest "${quest.name}".`
      );
    }

    return standings;
  } catch (err) {
    console.error(
      `[finalizeQuestResults Error] Failed to snapshot quest results for ${questId}:`,
      err.message
    );
    return [];
  }
};

module.exports = {
  finalizeQuestResults,
};

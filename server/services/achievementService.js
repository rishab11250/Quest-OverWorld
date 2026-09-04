const TeamAchievement = require('../models/TeamAchievement');
const TeamActivity = require('../models/TeamActivity');
const { ACHIEVEMENTS } = require('../utils/achievements');

/**
 * Evaluates achievements for a given team based on current event context.
 * Fires activity log entry for each newly earned badge.
 * Designed to never throw past the caller.
 */
const evaluateAchievements = async (team, context = {}) => {
  try {
    if (!team || !team._id) return [];

    const existing = await TeamAchievement.find({ teamId: team._id }).select('achievementId');
    const earnedSet = new Set(existing.map((a) => a.achievementId));
    const newlyEarned = [];

    for (const badge of ACHIEVEMENTS) {
      if (earnedSet.has(badge.id)) continue;

      try {
        const satisfied = await badge.check(team, context);
        if (satisfied) {
          const doc = await TeamAchievement.create({
            teamId: team._id,
            achievementId: badge.id,
            earnedAt: new Date(),
          });

          // Integration with Feature E: write an activity log entry
          await TeamActivity.create({
            teamId: team._id,
            actorId: context.actorId || team.leader,
            type: 'achievement_earned',
            message: `🏆 Party earned ${badge.title}!`,
          }).catch((actErr) => console.error('[Achievement Activity Error]', actErr.message));

          newlyEarned.push(doc);
        }
      } catch (checkErr) {
        console.error(`[Achievement Check Error: ${badge.id}]`, checkErr.message);
      }
    }

    return newlyEarned;
  } catch (error) {
    console.error('[evaluateAchievements Error]', error.message);
    return [];
  }
};

module.exports = {
  evaluateAchievements,
};

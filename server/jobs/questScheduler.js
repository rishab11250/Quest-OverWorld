const Quest = require('../models/Quest');
const { finalizeQuestResults } = require('../services/questCompletionService');

/**
 * Runs one check of scheduled quests:
 * 1. Activates draft quests whose startAt <= now (if no other quest is active)
 * 2. Completes active quests whose endAt <= now and snapshots results
 */
const checkScheduledQuests = async () => {
  const now = new Date();

  // 1. Auto-complete expired active quests
  try {
    const expiredQuests = await Quest.find({
      status: 'active',
      endAt: { $ne: null, $lte: now },
    });

    for (const quest of expiredQuests) {
      try {
        console.log(
          `[QuestScheduler] Expiring active quest "${quest.name}" (${quest._id}) past endAt: ${quest.endAt}`
        );
        quest.status = 'completed';
        await quest.save();

        // Snapshot standings for the completed quest
        await finalizeQuestResults(quest._id);
      } catch (saveErr) {
        console.error(
          `[QuestScheduler Error] Failed to complete quest "${quest.name}":`,
          saveErr.message
        );
      }
    }
  } catch (err) {
    console.error('[QuestScheduler Error] Error checking expired quests:', err.message);
  }

  // 2. Auto-activate scheduled draft quests
  try {
    const activeQuest = await Quest.findOne({ status: 'active' });

    // Only look for draft quests to activate if no quest is currently active
    if (!activeQuest) {
      const scheduledDrafts = await Quest.find({
        status: 'draft',
        startAt: { $ne: null, $lte: now },
      }).sort({ startAt: 1 });

      for (const draftQuest of scheduledDrafts) {
        try {
          // Double check no other quest became active during this tick
          const currentActive = await Quest.findOne({ status: 'active' });
          if (currentActive) {
            console.warn(
              `[QuestScheduler Warning] Cannot activate "${draftQuest.name}" (${draftQuest._id}): quest "${currentActive.name}" is already active.`
            );
            break;
          }

          console.log(
            `[QuestScheduler] Activating scheduled quest "${draftQuest.name}" (${draftQuest._id}) past startAt: ${draftQuest.startAt}`
          );
          draftQuest.status = 'active';
          await draftQuest.save();
          // Successfully activated one quest; exit loop to uphold single-active invariant
          break;
        } catch (saveErr) {
          if (
            saveErr.name === 'SingleActiveQuestConflictError' ||
            saveErr.message?.includes('already active')
          ) {
            console.warn(
              `[QuestScheduler Conflict] Skipping activation of "${draftQuest.name}": ${saveErr.message}`
            );
          } else {
            console.error(
              `[QuestScheduler Error] Failed to activate draft quest "${draftQuest.name}":`,
              saveErr.message
            );
          }
        }
      }
    }
  } catch (err) {
    console.error('[QuestScheduler Error] Error checking scheduled start quests:', err.message);
  }
};

let schedulerInterval = null;

const startQuestScheduler = (intervalMs = 30000) => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  console.log(
    `[QuestScheduler] Started quest scheduler service (polling every ${Math.round(intervalMs / 1000)}s)`
  );
  // Run an immediate check on startup
  checkScheduledQuests().catch((err) =>
    console.error('[QuestScheduler] Initial run error:', err.message)
  );

  schedulerInterval = setInterval(() => {
    checkScheduledQuests().catch((err) =>
      console.error('[QuestScheduler] Tick error:', err.message)
    );
  }, intervalMs);

  return schedulerInterval;
};

const stopQuestScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
};

module.exports = {
  checkScheduledQuests,
  startQuestScheduler,
  stopQuestScheduler,
};

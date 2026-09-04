const Progress = require('../models/Progress');
const GameConfig = require('../models/GameConfig');

const ACHIEVEMENTS = [
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'First party ever to clear Checkpoint 1 of the active quest.',
    check: async (team, context) => {
      if (context.order !== 1 || !context.checkpointId) {
        return false;
      }
      const count = await Progress.countDocuments({ checkpointId: context.checkpointId });
      return count === 1;
    },
  },
  {
    id: 'clean_solve',
    title: 'Clean Solve',
    description: 'Solved a trivia or riddle bounty on the very first attempt.',
    check: async (team, context) => {
      return context.isCleanSolve === true || context.attempts === 0;
    },
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Cleared a checkpoint or bounty between midnight and 5:00 AM server time.',
    check: async (team, context) => {
      const date = context.timestamp || new Date();
      const hour = date.getHours();
      return hour >= 0 && hour < 5;
    },
  },
  {
    id: 'full_house',
    title: 'Full House',
    description: 'Recruited adventurers to reach the maximum party capacity.',
    check: async (team, context) => {
      const config = await GameConfig.getSingleton();
      const maxTeamSize = config?.maxTeamSize || 6;
      const count = Array.isArray(team.members) ? team.members.length : 0;
      return count >= maxTeamSize;
    },
  },
];

module.exports = {
  ACHIEVEMENTS,
};

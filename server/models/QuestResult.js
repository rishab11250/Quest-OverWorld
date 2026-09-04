const mongoose = require('mongoose');

const questResultSchema = new mongoose.Schema(
  {
    questId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quest',
      required: true,
      index: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    finalScore: {
      type: Number,
      required: true,
    },
    finalRank: {
      type: Number,
      required: true,
    },
    checkpointsCleared: {
      type: Number,
      default: 0,
    },
    challengesCleared: {
      type: Number,
      default: 0,
    },
    scoreBreakdown: {
      checkpoints: {
        type: Number,
        default: 0,
      },
      challenges: {
        type: String,
        default: 'not tracked per-quest',
      },
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one final snapshot result per team per quest
questResultSchema.index({ questId: 1, teamId: 1 }, { unique: true });

module.exports = mongoose.model('QuestResult', questResultSchema);

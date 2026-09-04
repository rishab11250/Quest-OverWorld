const mongoose = require('mongoose');

const teamAchievementSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    achievementId: {
      type: String,
      required: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

teamAchievementSchema.index({ teamId: 1, achievementId: 1 }, { unique: true });

module.exports = mongoose.model('TeamAchievement', teamAchievementSchema);

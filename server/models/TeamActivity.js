const mongoose = require('mongoose');

const teamActivitySchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'checkpoint_cleared',
        'challenge_solved',
        'member_joined',
        'member_left',
        'member_kicked',
        'role_changed',
        'achievement_earned',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

teamActivitySchema.index({ teamId: 1, createdAt: -1 });

module.exports = mongoose.model('TeamActivity', teamActivitySchema);

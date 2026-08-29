const mongoose = require('mongoose');

const challengeAttemptSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    usedBonusRetry: {
      type: Boolean,
      default: false,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['in_progress', 'solved', 'locked'],
      default: 'in_progress',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring 1 attempt record per team per challenge
challengeAttemptSchema.index({ teamId: 1, challengeId: 1 }, { unique: true });

const ChallengeAttempt = mongoose.model('ChallengeAttempt', challengeAttemptSchema);

module.exports = ChallengeAttempt;

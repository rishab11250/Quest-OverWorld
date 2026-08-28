const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Team ID is required'],
      index: true,
    },
    questId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quest',
      required: [true, 'Quest ID is required'],
      index: true,
    },
    checkpointId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Checkpoint',
      required: [true, 'Checkpoint ID is required'],
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User verifying discovery is required'],
    },
    pointsAwarded: {
      type: Number,
      required: true,
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique checkpoint completion per team via compound index
progressSchema.index({ teamId: 1, checkpointId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);

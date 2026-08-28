const mongoose = require('mongoose');

const questSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a quest name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a quest description'],
      trim: true,
    },
    campus: {
      type: String,
      required: [true, 'Please specify campus location'],
      trim: true,
      default: 'Main Campus',
    },
    checkpoints: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Checkpoint',
      },
    ],
    specialChallenges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'archived'],
      default: 'active',
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Quest', questSchema);

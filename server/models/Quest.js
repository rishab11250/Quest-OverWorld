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
      default: 'draft',
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

// Model-level single-active-quest enforcement guard
questSchema.pre('save', async function (next) {
  if (this.status === 'active') {
    const existingActive = await this.constructor.findOne({
      status: 'active',
      _id: { $ne: this._id },
    });
    if (existingActive) {
      const err = new Error(
        `Conflict: "${existingActive.name}" is already active. Only one quest can be active at a time.`
      );
      err.name = 'SingleActiveQuestConflictError';
      err.conflictQuestId = existingActive._id;
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Quest', questSchema);

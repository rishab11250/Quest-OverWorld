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

// Model-level single-active-quest enforcement guard (Document middleware: create/save)
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

// Model-level single-active-quest enforcement guard (Query middleware: findByIdAndUpdate / findOneAndUpdate)
questSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (!update) return next();

  const newStatus = update.status || (update.$set && update.$set.status);
  if (newStatus === 'active') {
    const query = this.getQuery() || {};
    const docId = query._id;
    const existingActive = await this.model.findOne({
      status: 'active',
      ...(docId ? { _id: { $ne: docId } } : {}),
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

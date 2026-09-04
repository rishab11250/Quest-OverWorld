const mongoose = require('mongoose');

const hintRevealSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['checkpoint', 'challenge'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    hintIndex: {
      type: Number,
      required: true,
    },
    revealedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

hintRevealSchema.index({ teamId: 1, targetType: 1, targetId: 1, hintIndex: 1 }, { unique: true });

module.exports = mongoose.model('HintReveal', hintRevealSchema);

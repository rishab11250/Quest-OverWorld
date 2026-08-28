const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide challenge title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide challenge description'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['photo', 'riddle', 'trivia', 'creative'],
      default: 'photo',
    },
    points: {
      type: Number,
      required: [true, 'Points value is required'],
      default: 150,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    verificationType: {
      type: String,
      enum: ['manual_review', 'auto_answer'],
      default: 'manual_review',
    },
    answerKey: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Challenge', challengeSchema);

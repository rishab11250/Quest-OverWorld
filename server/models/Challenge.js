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
    minPoints: {
      type: Number,
      default: 50,
    },
    maxPoints: {
      type: Number,
      default: 200,
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
    hints: [
      {
        text: { type: String, required: true },
        cost: { type: Number, default: 20 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Challenge', challengeSchema);

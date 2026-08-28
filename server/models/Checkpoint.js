const mongoose = require('mongoose');

const checkpointSchema = new mongoose.Schema(
  {
    questId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quest',
      required: [true, 'Checkpoint must belong to a quest'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide checkpoint title'],
      trim: true,
    },
    clue: {
      type: String,
      required: [true, 'Please provide checkpoint clue'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    radius: {
      type: Number,
      default: 50, // in meters
    },
    qrCode: {
      type: String,
      required: [true, 'QR code string is required'],
      trim: true,
    },
    points: {
      type: Number,
      default: 100,
    },
    order: {
      type: Number,
      required: [true, 'Checkpoint order is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee unique checkpoint order within a quest
checkpointSchema.index({ questId: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Checkpoint', checkpointSchema);

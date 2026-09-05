const mongoose = require('mongoose');

const SINGLETON_ID = 'game_config_singleton';

const gameConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: SINGLETON_ID },
    maxTeamSize: {
      type: Number,
      default: 6,
      min: [1, 'Team size must be at least 1'],
      max: [50, 'Team size cannot exceed 50'],
    },
  },
  {
    timestamps: true,
  }
);

gameConfigSchema.statics.getSingleton = async function () {
  return this.findOneAndUpdate(
    { _id: SINGLETON_ID },
    { $setOnInsert: { maxTeamSize: 6 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model('GameConfig', gameConfigSchema);

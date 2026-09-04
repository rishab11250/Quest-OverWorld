const mongoose = require('mongoose');

const gameConfigSchema = new mongoose.Schema(
  {
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

// Lazy-init singleton helper
gameConfigSchema.statics.getSingleton = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({ maxTeamSize: 6 });
  }
  return config;
};

module.exports = mongoose.model('GameConfig', gameConfigSchema);

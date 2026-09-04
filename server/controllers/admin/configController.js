const GameConfig = require('../../models/GameConfig');

const getConfig = async (req, res) => {
  try {
    const config = await GameConfig.getSingleton();
    return res.status(200).json({ success: true, config });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || 'Server error fetching game configuration' });
  }
};

const updateConfig = async (req, res) => {
  try {
    const { maxTeamSize } = req.body;
    if (maxTeamSize == null || isNaN(Number(maxTeamSize)) || Number(maxTeamSize) < 1) {
      return res.status(400).json({ message: 'Valid maxTeamSize (minimum 1) is required.' });
    }

    const config = await GameConfig.getSingleton();
    config.maxTeamSize = Math.floor(Number(maxTeamSize));
    await config.save();

    return res.status(200).json({
      success: true,
      message: `Party size limit updated to ${config.maxTeamSize} players.`,
      config,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || 'Server error updating game configuration' });
  }
};

module.exports = {
  getConfig,
  updateConfig,
};

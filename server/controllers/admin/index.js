const overviewController = require('./overviewController');
const questController = require('./questController');
const checkpointController = require('./checkpointController');
const challengeController = require('./challengeController');
const reviewController = require('./reviewController');
const playerController = require('./playerController');
const teamController = require('./teamController');
const systemController = require('./systemController');

module.exports = {
  ...overviewController,
  ...questController,
  ...checkpointController,
  ...challengeController,
  ...reviewController,
  ...playerController,
  ...teamController,
  ...systemController,
};

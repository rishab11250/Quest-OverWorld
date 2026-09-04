const overviewController = require('./overviewController');
const questController = require('./questController');
const checkpointController = require('./checkpointController');
const challengeController = require('./challengeController');
const reviewController = require('./reviewController');
const playerController = require('./playerController');
const teamController = require('./teamController');
const systemController = require('./systemController');
const configController = require('./configController');
const announcementController = require('./announcementController');
const analyticsController = require('./analyticsController');

module.exports = {
  ...overviewController,
  ...questController,
  ...checkpointController,
  ...challengeController,
  ...reviewController,
  ...playerController,
  ...teamController,
  ...systemController,
  ...configController,
  ...announcementController,
  ...analyticsController,
};

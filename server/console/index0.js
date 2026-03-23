const Menu = require('./utils/console/menu');
const EventLogger = require('./utils/console/eventLogger');

// Initialize event logger
const logger = new EventLogger();

// Log startup
logger.log('Server started');
logger.log('Initializing menu system...');

// Create and start menu
const menu = new Menu(logger);
menu.start();
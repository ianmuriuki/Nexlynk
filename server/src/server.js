// src/server.js
require('dotenv').config();

const app = require('./app');
const { testConnection } = require('./config/db');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

// this is the function that starts the server after ensuring the database connection is successful.
//  It also sets up graceful shutdown and unhandled rejection handling to ensure the server can shut down cleanly and log any unexpected errors.
async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

start();
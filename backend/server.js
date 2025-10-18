require('dotenv').config();
const app = require('./src/app');
const { connectDatabase, testConnection } = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const cron = require('node-cron');
const categorizationQueueService = require('./src/services/categorizationQueue.service');

// Process queue every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('⏰ Processing AI categorization queue...');
  try {
    const result = await categorizationQueueService.processQueue(20);
    console.log(`✅ Processed ${result.processedCount} items`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
});

// Test database connection before starting server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    logger.info('✓ Database connection established successfully');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`✓ Server running in ${NODE_ENV} mode on port ${PORT}`);
      logger.info(`✓ API available at http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('Shutting down gracefully...');
      
      server.close(async () => {
        logger.info('✓ Server closed');
        
        try {
          const db = await connectDatabase();
          await db.end();
          logger.info('✓ Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error closing database connection:', error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forcing shutdown...');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown();
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();


const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const config = require('./config');
const { connectDatabases, logger } = require('./config/database');
const passport = require('./config/passport');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const { helmetConfig, securityLogger, generalRateLimit } = require('./middleware/security');

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmetConfig);
app.use(securityLogger);
app.use(generalRateLimit);

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000', // React Dev Server
      'http://localhost:8080', // Frontend URL
      'http://127.0.0.1:8080', // Alternative frontend URL
      'https://buymediamonds.co.uk', // Production Frontend
      'https://www.buymediamonds.co.uk', // Production Frontend (www)
      'https://api.buymediamonds.co.uk', // Production API
      ...(config.cors?.allowedOrigins || []) // Any additional origins from config
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Compression and parsing middleware
app.use(compression());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Initialize Passport
app.use(passport.initialize());

// Logging middleware
if (config.NODE_ENV !== 'test') {
  app.use(morgan(config.logging.format, {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    environment: config.NODE_ENV,
    version: config.API_VERSION,
    timestamp: new Date().toISOString()
  });
});

// Initialize database models
const { initializeModels } = require('./models');

// API routes
const apiRoutes = require('./routes');
app.use(`/api/${config.API_VERSION}`, apiRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      const { closeDatabases } = require('./config/database');
      await closeDatabases();
      logger.info('Database connections closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    await connectDatabases();

    // Initialize database models
    initializeModels();
    logger.info('Database models initialized');

    const server = app.listen(config.PORT, () => {
      logger.info(`🚀 Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${config.PORT}/api/${config.API_VERSION}`);
    });

    // Export server for testing
    module.exports = { app, server };

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer }; // restarting
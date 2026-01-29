const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const config = require('./config');
const { connectDatabases, logger } = require('./config/database');
const passport = require('./config/passport');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const { helmetConfig, securityLogger, generalRateLimit } = require('./middleware/security');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://127.0.0.1:8080', 'http://127.0.0.1:8081', 'http://127.0.0.1:8082'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

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

// Static file serving for uploads with video streaming support
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  // Enable Accept-Ranges for video streaming
  acceptRanges: true,
  // Set proper cache headers
  maxAge: '1d',
  // Set headers for video files
  setHeaders: (res, filePath) => {
    // Check if it's a video file
    if (filePath.endsWith('.mp4') || filePath.endsWith('.webm') || filePath.endsWith('.ogg')) {
      res.set('Accept-Ranges', 'bytes');
      res.set('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Health check endpoint - returns server and database status
app.get('/health', async (req, res) => {
  const { postgresDB } = require('./config/database');
  let dbStatus = 'disconnected';

  try {
    const db = postgresDB();
    if (db) {
      await db.authenticate();
      dbStatus = 'connected';
    }
  } catch (error) {
    dbStatus = 'error';
  }

  res.json({
    success: true,
    message: 'Server is running',
    environment: config.NODE_ENV,
    version: config.API_VERSION,
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Socket.io Chat Events
const typingUsers = new Map(); // Track typing users by chat_id

io.on('connection', (socket) => {
  logger.info(`Chat connection established: ${socket.id}`);

  // Join a chat room
  socket.on('join_chat', (data) => {
    const { chat_id, user_type, user_id } = data;
    const roomName = `chat_${chat_id}`;
    socket.join(roomName);

    if (!typingUsers.has(chat_id)) {
      typingUsers.set(chat_id, []);
    }

    // Notify others that someone joined
    socket.to(roomName).emit('user_joined', {
      user_type,
      user_id,
      timestamp: new Date()
    });

    logger.info(`User joined chat ${chat_id}: ${user_type}`);
  });

  // Send message in real-time
  socket.on('send_message', (data) => {
    const { chat_id, message } = data;
    const roomName = `chat_${chat_id}`;

    // Broadcast message to all users in this chat room
    io.to(roomName).emit('receive_message', {
      ...message,
      id: message.id,
      created_at: message.created_at
    });

    // Broadcast to admin panel for chat list updates (admin_chat_list room)
    // This is a separate broadcast to avoid duplication on client side
    io.emit('admin_chat_update', {
      ...message,
      chat_id: chat_id,
      id: message.id,
      created_at: message.created_at
    });

    logger.info(`Message in chat ${chat_id}`);
  });

  // Typing indicator
  socket.on('user_typing', (data) => {
    const { chat_id, user_type, user_id, is_typing } = data;
    const roomName = `chat_${chat_id}`;

    if (is_typing) {
      const typingKey = `${user_type}_${user_id}`;
      if (!typingUsers.get(chat_id).includes(typingKey)) {
        typingUsers.get(chat_id).push(typingKey);
      }
    } else {
      const typingKey = `${user_type}_${user_id}`;
      const users = typingUsers.get(chat_id) || [];
      typingUsers.set(chat_id, users.filter(u => u !== typingKey));
    }

    // Broadcast typing status
    socket.to(roomName).emit('typing_status', {
      chat_id,
      user_type,
      user_id,
      is_typing,
      typing_users: typingUsers.get(chat_id) || []
    });
  });

  // Leave chat
  socket.on('leave_chat', (data) => {
    const { chat_id } = data;
    const roomName = `chat_${chat_id}`;
    socket.leave(roomName);

    // Clean up typing users
    if (typingUsers.has(chat_id)) {
      typingUsers.delete(chat_id);
    }

    logger.info(`User left chat ${chat_id}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Chat disconnected: ${socket.id}`);
  });
});

// Middleware to attach io instance to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

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
    // Try to connect to databases with retry logic
    const dbConnected = await connectDatabases();

    // Models are now initialized during database connection
    if (!dbConnected) {
      logger.warn('⚠️  Server starting without database connection');
      logger.warn('⚠️  Some API endpoints may not work until database is connected');
    }

    // Start HTTP server regardless of database status
    server.listen(config.PORT, () => {
      logger.info(`🚀 Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${config.PORT}/api/${config.API_VERSION}`);
      logger.info(`💬 WebSocket Chat Server ready`);

      if (!dbConnected) {
        logger.warn('⚠️  Database connection failed - check environment variables:');
        logger.warn('   - PG_HOST, PG_PORT, PG_DATABASE, PG_USERNAME, PG_PASSWORD');
      }
    });

    // Export server for testing
    module.exports = { app, server };

    return server;
  } catch (error) {
    logger.error('Failed to start HTTP server:', error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer }; // restarting
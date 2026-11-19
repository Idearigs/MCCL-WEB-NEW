const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
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
    origin: [
      'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082',
      'http://127.0.0.1:8080', 'http://127.0.0.1:8081', 'http://127.0.0.1:8082',
      'https://buymediamonds.co.uk', 'https://www.buymediamonds.co.uk', 'https://api.buymediamonds.co.uk',
      'https://mccullochjewellers.co.uk', 'https://www.mccullochjewellers.co.uk', 'https://api.mccullochjewellers.co.uk'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  transports: ['websocket', 'polling']
});

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmetConfig);
app.use(securityLogger);

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
      'https://buymediamonds.co.uk', // Production Frontend (old domain, kept for 301 transition)
      'https://www.buymediamonds.co.uk', // Production Frontend (www, old)
      'https://api.buymediamonds.co.uk', // Production API (old)
      'https://mccullochjewellers.co.uk', // Production Frontend (new primary domain)
      'https://www.mccullochjewellers.co.uk', // Production Frontend (www, new)
      'https://api.mccullochjewellers.co.uk', // Production API (new)
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

// General rate limit — applied AFTER CORS so a 429 still carries CORS headers
// (otherwise a rate-limited request surfaces in the browser as a CORS error).
// Skip admin (bulk ops), /uploads (static images) and /media (video streaming:
// a single autoplay video fires many HTTP range requests, so counting them here
// rate-limited video playback — worst on mobile, which chunks aggressively).
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/admin')) return next();
  if (req.path.startsWith('/uploads')) return next();
  if (req.path.startsWith('/media')) return next();
  return generalRateLimit(req, res, next);
});

// Compression and parsing middleware
app.use(compression());
// JSON/urlencoded bodies are small (carts, forms); file uploads go through multer
// (multipart) and are unaffected. A tight limit blunts oversized-payload DoS.
//
// The Stripe webhook MUST receive the untouched raw body so its signature can be
// verified (constructEvent needs the exact bytes). Skip JSON parsing for that one
// path so the route's own express.raw() parser gets the raw Buffer; every other
// route still gets normal JSON parsing.
const STRIPE_WEBHOOK_PATH = `/api/${config.API_VERSION}/webhooks/stripe`;
const jsonParser = express.json({ limit: '2mb' });
app.use((req, res, next) => {
  if (req.originalUrl.split('?')[0] === STRIPE_WEBHOOK_PATH) return next();
  return jsonParser(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

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

// Private uploads (secure-viewing ID photos) are only ever streamed through the
// PIN-protected API — never via the public static handler below.
app.use('/uploads/_private', (req, res) => res.status(404).end());

// Static file serving for uploads with video streaming support
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  // Enable Accept-Ranges for video streaming
  acceptRanges: true,
  // Set proper cache headers
  maxAge: '1d',
  // Set headers for video files
  setHeaders: (res, filePath) => {
    // Uploaded files are media only: never let one run script or be sniffed as another
    // type, even if a legacy upload kept a document-like extension.
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; sandbox");
    if (/\.(html?|xhtml|xml|svg|svgz|js|mjs)$/i.test(filePath)) {
      res.set('Content-Disposition', 'attachment');
    }
    // Check if it's a video file
    if (filePath.endsWith('.mp4') || filePath.endsWith('.webm') || filePath.endsWith('.ogg')) {
      // Keep byte-range support AND make the file cleanly cacheable at the edge.
      // Cloudflare only serves 206 range responses out of its cache, and it will
      // NOT cache any response carrying `Vary: Origin` (added by the CORS middleware).
      // That left every .mp4 a permanent cache MISS, which Cloudflare downgrades to a
      // rangeless `200` full-body response — and iOS/WebKit refuses to play a video
      // that answers a Range request with 200 instead of 206 (Android Chrome tolerates
      // it, hence "plays on Android, black on iPhone"). Dropping Vary + marking the
      // file immutable lets Cloudflare cache it and serve real byte ranges. A <video>
      // element does not send a CORS-credentialed request, so Vary:Origin is not needed.
      res.removeHeader('Vary');
      res.set('Accept-Ranges', 'bytes');
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      // Public media, fetched cross-origin as a blob by the PDP (so iOS can play
      // it regardless of Cloudflare's byte-range handling). Use a wildcard,
      // credential-less CORS header so a single cached copy is valid for every
      // site origin (apex + www) — an echoed, per-origin header would be
      // cache-poisoned now that Vary:Origin is gone.
      res.set('Access-Control-Allow-Origin', '*');
      res.removeHeader('Access-Control-Allow-Credentials');
    }
  }
}));

/*
 * Range-capable product-video stream on an EXTENSIONLESS path.
 *
 * Cloudflare (in front of api.buymediamonds.co.uk) buffers cacheable `.mp4`
 * responses and answers Range requests with a rangeless `200` full body — which
 * iOS/WebKit refuses to play (Android Chrome tolerates it). Serving the exact
 * same files from a path with no media extension makes Cloudflare treat the
 * response as dynamic and forward byte ranges straight through, so iOS receives
 * the `206 Partial Content` it requires. URL: /media/videos/<sku>  ->  file
 * uploads/videos/<sku>.mp4.
 */
app.get('/media/videos/:name', (req, res) => {
  const name = String(req.params.name || '');
  if (!/^[A-Za-z0-9_-]+$/.test(name)) return res.status(400).end();
  // Product films are uploaded under uploads/products/; older ones under uploads/videos/.
  // Serve from whichever directory holds the file so both stream with byte-range support.
  const candidates = [
    path.join(__dirname, 'uploads', 'videos', `${name}.mp4`),
    path.join(__dirname, 'uploads', 'products', `${name}.mp4`),
  ];
  const file = candidates.find(f => { try { return fs.statSync(f).isFile(); } catch { return false; } });
  if (!file) return res.status(404).end();
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return res.status(404).end();
    const total = stat.size;
    res.set('Content-Type', 'video/mp4');
    res.set('Accept-Ranges', 'bytes');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let start = m && m[1] ? parseInt(m[1], 10) : 0;
      let end = m && m[2] ? parseInt(m[2], 10) : total - 1;
      if (!Number.isFinite(start) || start < 0) start = 0;
      if (!Number.isFinite(end) || end >= total) end = total - 1;
      if (start > end) return res.status(416).set('Content-Range', `bytes */${total}`).end();
      res.status(206);
      res.set('Content-Range', `bytes ${start}-${end}/${total}`);
      res.set('Content-Length', end - start + 1);
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.status(200);
    res.set('Content-Length', total);
    return fs.createReadStream(file).pipe(res);
  });
});

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

  let cacheStatus = 'unavailable';
  try { cacheStatus = await require('./services/cacheService').ping(); } catch { cacheStatus = 'unavailable'; }

  res.json({
    success: true,
    message: 'Server is running',
    environment: config.NODE_ENV,
    version: config.API_VERSION,
    database: dbStatus,
    cache: cacheStatus === 'connected' ? 'redis' : 'in-memory',
    timestamp: new Date().toISOString()
  });
});

// Socket.io Chat Events
//
// Visitors connect anonymously and may join only the room of a chat whose id they hold.
// Staff sockets authenticate with their admin access token (handshake auth.token) and
// join the 'staff' room, which alone receives dashboard events (new_chat,
// admin_chat_update). Messages are broadcast by the HTTP send route from the stored
// record, so the socket 'send_message' relay is ignored. Every handler validates its
// payload: a thrown error here would reach process.on('uncaughtException').
const { verifyAdminToken } = require('./middleware/adminAuth');
const CHAT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const chatRoom = (data) => {
  const id = data && typeof data === 'object' ? data.chat_id : null;
  return typeof id === 'string' && CHAT_ID_RE.test(id) ? `chat_${id}` : null;
};
const safe = (fn) => (...args) => {
  try { return fn(...args); } catch (err) { logger.warn(`Socket handler error: ${err.message}`); }
};

io.use(async (socket, next) => {
  try {
    const token = socket.handshake && socket.handshake.auth && socket.handshake.auth.token;
    if (token) socket.data.staff = await verifyAdminToken(token);
  } catch { /* anonymous */ }
  next();
});

io.on('connection', (socket) => {
  const isStaff = !!socket.data.staff;
  if (isStaff) socket.join('staff');
  logger.info(`Chat connection established: ${socket.id}${isStaff ? ' (staff)' : ''}`);

  // Join a chat room (the chat id is the visitor's capability for their own chat)
  socket.on('join_chat', safe((data) => {
    const room = chatRoom(data);
    if (!room) return;
    socket.join(room);
    socket.to(room).emit('user_joined', {
      user_type: isStaff ? 'admin' : 'customer',
      user_id: isStaff ? socket.data.staff.id : null,
      timestamp: new Date()
    });
  }));

  // Kept for older clients that still relay after sending; delivery now happens in
  // POST /chats/message/send, so relayed (unverified) content is not re-broadcast.
  socket.on('send_message', () => {});

  // Typing indicator, only within a room this socket has joined
  socket.on('user_typing', safe((data) => {
    const room = chatRoom(data);
    if (!room || !socket.rooms.has(room)) return;
    socket.to(room).emit('typing_status', {
      chat_id: data.chat_id,
      user_type: isStaff ? 'admin' : 'customer',
      user_id: isStaff ? socket.data.staff.id : null,
      is_typing: !!data.is_typing,
      typing_users: []
    });
  }));

  socket.on('leave_chat', safe((data) => {
    const room = chatRoom(data);
    if (room) socket.leave(room);
  }));

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
  // Log but DO NOT exit. A single stray rejection (e.g. a background Nivoda price
  // fetch, an email send, or the daily refresh job) must not take down the whole
  // payment server. HTTP requests are isolated and the critical paths (payments,
  // orders, webhooks) have their own try/catch, so continuing is safe here.
  logger.error('Unhandled Rejection (server kept alive):', reason);
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

    // Ensure Engagement Rings category exists in the categories table
    if (dbConnected) {
      try {
        const { getModels } = require('./models');
        const { Category } = getModels();
        const rings = await Category.findOne({ where: { slug: 'rings' } });
        const [, created] = await Category.findOrCreate({
          where: { slug: 'engagement-rings' },
          defaults: {
            name: 'Engagement Rings',
            slug: 'engagement-rings',
            description: 'Celebrate your love with our stunning engagement ring collection',
            parent_id: rings ? rings.id : null,
            category_type: 'main',
            level: 1,
            is_active: true,
            sort_order: 1,
          },
        });
        if (created) logger.info('✅ Engagement Rings category created');
      } catch (err) {
        logger.warn('Could not ensure Engagement Rings category:', err.message);
      }
    }

    // Schedule daily ring price refresh (runs at 2am)
    if (dbConnected) {
      try {
        const { scheduleDailyRefresh } = require('./jobs/dailyPriceRefresh');
        scheduleDailyRefresh();
      } catch (err) {
        logger.warn('Could not start daily price refresh scheduler:', err.message);
      }
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
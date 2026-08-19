const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const config = require('../config');
const { logger } = require('../config/database');

const createRateLimit = (options = {}) => {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return (req, res, next) => next();
  }

  return rateLimit({
    windowMs: options.windowMs || config.security.rateLimitWindowMs,
    max: options.max || config.security.rateLimitMaxRequests,
    message: {
      success: false,
      message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }
  });
};

const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts per window
});

const generalRateLimit = createRateLimit();

const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200 // 200 requests per window for API calls
});

// Stricter limit for payment endpoints to blunt card-testing / abuse
const paymentRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25 // 25 payment attempts per IP per window
});

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https:"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https:",
        "data:"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // required by Stripe CardElement; replace with nonce when upgrading
        "https://js.stripe.com",
        "https://maps.googleapis.com",
        "https:",
        "blob:"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https:",
        "blob:",
        "data:"
      ],
      fontSrc: [
        "'self'",
        "https:",
        "data:"
      ],
      objectSrc: ["'none'"],
      mediaSrc: [
        "'self'",
        "https:",
        "data:",
        "blob:"
      ],
      frameSrc: [
        "'self'",
        "https:",
        "blob:"
      ],
      childSrc: [
        "'self'",
        "https:",
        "blob:"
      ],
      workerSrc: [
        "'self'",
        "https:",
        "blob:"
      ]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

const securityLogger = (req, res, next) => {
  const originalSend = res.send;

  res.send = function(body) {
    if (res.statusCode >= 400) {
      logger.warn(`Security event: ${res.statusCode} ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        user: req.user?.id
      });
    }

    originalSend.call(this, body);
  };

  next();
};

const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next();
    }

    const clientIP = req.ip || req.connection.remoteAddress;

    if (!allowedIPs.includes(clientIP)) {
      logger.warn(`IP not whitelisted: ${clientIP}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    next();
  };
};

module.exports = {
  createRateLimit,
  authRateLimit,
  generalRateLimit,
  apiRateLimit,
  paymentRateLimit,
  helmetConfig,
  securityLogger,
  ipWhitelist
};
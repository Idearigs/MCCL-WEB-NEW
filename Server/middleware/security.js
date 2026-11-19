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
    // NB: config keys are rateLimitWindow / rateLimitMax (not ...Ms/...MaxRequests).
    // The old names were undefined, so this silently fell back to the library's
    // tiny default (~5/min) and rate-limited normal browsing. Use the real keys.
    windowMs: options.windowMs || config.security.rateLimitWindow || 15 * 60 * 1000,
    max: options.max || config.security.rateLimitMax || 600,
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

// Generous window for a catalog site: listing pages fire several API calls each.
const generalRateLimit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 2000 });

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

// Request bodies are logged for diagnostics, but never their secrets or personal data:
// passwords, PINs, tokens, ID numbers, card/payment fields and contact details.
const REDACT_KEY = /pass(word)?|pin\b|^pin$|token|secret|otp|code$|id_number|card|cvc|cvv|iban|sort_?code|account_?number|phone|date_of_birth|dob|address|street|postcode|postal/i;
const redactBody = (body, depth = 0) => {
  if (body == null || typeof body !== 'object') return body;
  if (depth > 3) return '[object]';
  if (Array.isArray(body)) return body.slice(0, 20).map((v) => redactBody(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(body)) {
    out[k] = REDACT_KEY.test(k) ? '[redacted]' : (typeof v === 'object' ? redactBody(v, depth + 1) : v);
  }
  return out;
};

const securityLogger = (req, res, next) => {
  const originalSend = res.send;

  res.send = function(body) {
    if (res.statusCode >= 400) {
      logger.warn(`Security event: ${res.statusCode} ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: redactBody(req.body),
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
  redactBody,
  createRateLimit,
  authRateLimit,
  generalRateLimit,
  apiRateLimit,
  paymentRateLimit,
  helmetConfig,
  securityLogger,
  ipWhitelist
};
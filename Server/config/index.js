require('dotenv').config();

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  API_VERSION: process.env.API_VERSION || 'v1',

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'
  },

  postgres: {
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'mcculloch_db',
    username: process.env.PG_USERNAME || 'postgres',
    password: process.env.PG_PASSWORD
  },

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mcculloch_logs',
    testUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/mcculloch_logs_test'
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null
  },

  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: process.env.EMAIL_FROM || 'noreply@mcculloch.com'
  },

  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || 10485760, // 10MB
    path: process.env.UPLOAD_PATH || './uploads'
  },

  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:5173']
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  }
};

// Validate critical configuration
const validateConfig = () => {
  const requiredEnvVars = [];

  if (config.NODE_ENV === 'production') {
    requiredEnvVars.push(
      'JWT_SECRET',
      'PG_PASSWORD',
      'MONGODB_URI'
    );
  }

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Validate config on startup
if (config.NODE_ENV !== 'test') {
  validateConfig();
}

module.exports = config;
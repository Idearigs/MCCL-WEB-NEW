const dotenv = require('dotenv');
dotenv.config();

const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database Configuration
  database: {
    // PostgreSQL Configuration
    postgres: {
      host: process.env.PG_HOST || process.env.POSTGRES_HOST || 'localhost',
      port: process.env.PG_PORT || process.env.POSTGRES_PORT || 5432,
      database: process.env.PG_DATABASE || process.env.POSTGRES_DB || 'mcculloch_db',
      username: process.env.PG_USERNAME || process.env.POSTGRES_USER || 'postgres',
      password: process.env.PG_PASSWORD || process.env.POSTGRES_PASSWORD,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    },

    // MongoDB Configuration
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mcculloch_logs',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'https://your-frontend-domain.com'],
    credentials: true
  },

  // File Upload Configuration
  upload: {
    maxSize: process.env.MAX_UPLOAD_SIZE || '10MB',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    destination: process.env.UPLOAD_PATH || './uploads'
  },

  // Security Configuration
  security: {
    saltRounds: process.env.SALT_ROUNDS || 12,
    rateLimitWindow: process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: process.env.RATE_LIMIT_MAX || 100 // requests per window
  }
};

module.exports = config;
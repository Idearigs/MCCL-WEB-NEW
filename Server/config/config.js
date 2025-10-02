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
      host: process.env.POSTGRES_HOST || '31.97.116.89',
      port: process.env.POSTGRES_PORT || 5433,
      database: process.env.POSTGRES_DB || 'mcculloch_db',
      username: process.env.POSTGRES_USER || 'mcculloch_admin',
      password: process.env.POSTGRES_PASSWORD || '#mcculloch_admin#20026',
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
      uri: process.env.MONGODB_URI || `mongodb://mcculloch-mdb:#mcculloch_admin#20026@31.97.116.89:27019/mcculloch_logs`,
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
    secret: process.env.JWT_SECRET || 'mcculloch_jwt_secret_key_2024_production',
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
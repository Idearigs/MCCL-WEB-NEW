const { Sequelize } = require('sequelize');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

let postgresDB = null;

const connectPostgreSQL = async () => {
  try {
    postgresDB = new Sequelize({
      host: process.env.PG_HOST || 'localhost',
      port: process.env.PG_PORT || 5432,
      database: process.env.PG_DATABASE || 'mcculloch_db',
      username: process.env.PG_USERNAME || 'postgres',
      password: process.env.PG_PASSWORD,
      dialect: 'postgres',
      logging: false,  // Disable all SQL logging for cleaner startup
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    });

    await postgresDB.authenticate();
    logger.info('PostgreSQL connected successfully');

    // Initialize models BEFORE sync so all models are defined
    const { initializeModels } = require('../models');
    initializeModels();
    logger.info('Database models initialized');

    // Create promotions table if it doesn't exist
    try {
      await postgresDB.query(`
        CREATE TABLE IF NOT EXISTS "promotions" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "title" VARCHAR(255) NOT NULL,
          "description" TEXT,
          "product_id" UUID REFERENCES "products"("id") ON DELETE SET NULL,
          "discount_percentage" INTEGER,
          "banner_text" VARCHAR(500),
          "banner_text_1" VARCHAR(500),
          "banner_text_2" VARCHAR(500),
          "banner_text_3" VARCHAR(500),
          "banner_text_4" VARCHAR(500),
          "banner_text_5" VARCHAR(500),
          "image_url" VARCHAR(500),
          "is_active" BOOLEAN DEFAULT true,
          "show_popup" BOOLEAN DEFAULT true,
          "show_banner" BOOLEAN DEFAULT true,
          "sort_order" INTEGER DEFAULT 0,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Add new banner_text columns if they don't exist (silent mode)
      try {
        await postgresDB.query(`ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "banner_text_1" VARCHAR(500);`);
        await postgresDB.query(`ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "banner_text_2" VARCHAR(500);`);
        await postgresDB.query(`ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "banner_text_3" VARCHAR(500);`);
        await postgresDB.query(`ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "banner_text_4" VARCHAR(500);`);
        await postgresDB.query(`ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "banner_text_5" VARCHAR(500);`);
      } catch (error) {
        // Silently ignore column add errors
      }

      // Create indexes (silent mode)
      try {
        await postgresDB.query(`CREATE INDEX IF NOT EXISTS "idx_promotions_is_active" ON "promotions"("is_active");`);
        await postgresDB.query(`CREATE INDEX IF NOT EXISTS "idx_promotions_show_popup" ON "promotions"("show_popup");`);
        await postgresDB.query(`CREATE INDEX IF NOT EXISTS "idx_promotions_show_banner" ON "promotions"("show_banner");`);
        await postgresDB.query(`CREATE INDEX IF NOT EXISTS "idx_promotions_sort_order" ON "promotions"("sort_order");`);
      } catch (error) {
        // Silently ignore index creation errors
      }
    } catch (error) {
      logger.debug('Promotions table setup completed');
    }

    // Create chats table if it doesn't exist
    try {
      await postgresDB.query(`
        CREATE TABLE IF NOT EXISTS "chats" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "customer_name" VARCHAR(100) NOT NULL,
          "customer_email" VARCHAR(255) NOT NULL,
          "customer_user_id" UUID,
          "assigned_admin_id" UUID REFERENCES "admin_users"("id") ON DELETE SET NULL,
          "status" VARCHAR(50) DEFAULT 'waiting',
          "subject" VARCHAR(255),
          "last_message_at" TIMESTAMP,
          "is_archived" BOOLEAN DEFAULT false,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create chat_messages table (silent mode)
      await postgresDB.query(`
        CREATE TABLE IF NOT EXISTS "chat_messages" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "chat_id" UUID NOT NULL REFERENCES "chats"("id") ON DELETE CASCADE,
          "sender_type" VARCHAR(50) NOT NULL,
          "sender_id" UUID,
          "message" TEXT NOT NULL,
          "attachment_url" VARCHAR(500),
          "is_read" BOOLEAN DEFAULT false,
          "read_at" TIMESTAMP,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes for chat tables (silent mode)
      try {
        await postgresDB.query(`CREATE INDEX IF NOT EXISTS "idx_chats_customer_email" ON "chats"("customer_email");`);
        await postgresDB.query(`CREATE INDEX IF NOT EXISTS "idx_chats_status" ON "chats"("status");`);
        await postgresDB.query(`CREATE INDEX IF NOT EXISTS "idx_chats_assigned_admin" ON "chats"("assigned_admin_id");`);
        await postgresDB.query(`CREATE INDEX IF NOT EXISTS "idx_chat_messages_chat_id" ON "chat_messages"("chat_id");`);
        await postgresDB.query(`CREATE INDEX IF NOT EXISTS "idx_chat_messages_is_read" ON "chat_messages"("is_read");`);
      } catch (error) {
        // Silently ignore index creation errors
      }
    } catch (error) {
      logger.debug('Chat tables setup completed');
    }

    // NEVER run sync({ alter: true }) in production — it recreates duplicate
    // UNIQUE constraints on every deploy, causing catastrophic index bloat.
    // Use SQL migration files for schema changes instead.
    if (process.env.SYNC_DATABASE === 'true') {
      if (process.env.NODE_ENV === 'production') {
        logger.warn('SYNC_DATABASE=true is set but NODE_ENV=production — sync blocked to prevent duplicate constraint bloat. Remove SYNC_DATABASE from production env vars.');
      } else {
        logger.info('Database sync enabled via SYNC_DATABASE=true (development only)');
        await postgresDB.sync({ alter: true });
        logger.info('PostgreSQL models synchronized');
      }
    } else {
      logger.info('Database sync disabled — schema managed via migrations');
    }

    return postgresDB;
  } catch (error) {
    logger.error('PostgreSQL connection failed:', error.message);
    throw error;
  }
};


const connectDatabases = async (retryAttempts = 3, retryDelay = 5000) => {
  let lastError = null;

  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      await connectPostgreSQL();
      logger.info('PostgreSQL connected successfully');
      return true;
    } catch (error) {
      lastError = error;
      logger.error(`PostgreSQL connection attempt ${attempt}/${retryAttempts} failed:`, error.message);

      if (attempt < retryAttempts) {
        logger.info(`Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  logger.error('All database connection attempts failed. Server will start without database.');
  logger.error('Last error:', lastError?.message);
  return false;
};

const closeDatabases = async () => {
  try {
    if (postgresDB) {
      await postgresDB.close();
      logger.info('PostgreSQL connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connections:', error.message);
  }
};

module.exports = {
  connectDatabases,
  closeDatabases,
  postgresDB: () => postgresDB,
  logger
};
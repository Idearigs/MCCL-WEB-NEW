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
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
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

    if (process.env.NODE_ENV === 'development') {
      await postgresDB.sync({ alter: true });
      logger.info('PostgreSQL models synchronized');
    }

    return postgresDB;
  } catch (error) {
    logger.error('PostgreSQL connection failed:', error.message);
    throw error;
  }
};


const connectDatabases = async () => {
  try {
    await connectPostgreSQL();
    logger.info('PostgreSQL connected successfully');
  } catch (error) {
    logger.error('Critical database connection failed:', error.message);
    process.exit(1);
  }
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
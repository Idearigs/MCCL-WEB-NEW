require('dotenv').config();
const { connectDatabases } = require('./config/database');
const { initializeModels } = require('./models');
const { postgresDB } = require('./config/database');

const syncDatabase = async () => {
  try {
    console.log('🔄 Syncing database with new models...');

    // Initialize database connections
    await connectDatabases();
    console.log('✅ Database connections established');

    // Initialize models
    const models = initializeModels();
    console.log('✅ Models initialized');

    // Force sync with all models (including new ones)
    const sequelize = postgresDB();
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database synced with all models');

    // List all tables
    const tables = await sequelize.showAllSchemas();
    console.log('📊 Available tables:', tables);

    console.log('🎉 Database sync completed successfully!');
  } catch (error) {
    console.error('❌ Error syncing database:', error);
  } finally {
    process.exit(0);
  }
};

syncDatabase();
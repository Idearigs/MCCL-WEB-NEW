const { connectDatabases, logger } = require('../config/database');
const { initializeModels, getModels } = require('../models');

const syncSchema = async () => {
  try {
    console.log('Starting schema synchronization...');

    // Connect to database
    await connectDatabases();

    // Initialize models
    initializeModels();
    const { Category } = getModels();

    if (!Category) {
      throw new Error('Category model not initialized');
    }

    // Sync database schema with new structure
    console.log('Syncing database schema...');
    await Category.sync({ alter: true });

    console.log('Schema synchronization completed successfully!');
    console.log('New category model includes: parent_id, category_type, level fields');

    // Show current table structure
    const tableInfo = await Category.describe();
    console.log('Current Category table structure:');
    console.table(Object.keys(tableInfo));

  } catch (error) {
    console.error('Error syncing schema:', error);
    throw error;
  }
};

// Run the sync if this file is executed directly
if (require.main === module) {
  syncSchema()
    .then(() => {
      console.log('Schema sync completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Schema sync failed:', error);
      process.exit(1);
    });
}

module.exports = { syncSchema };
require('dotenv').config();
const { connectDatabases, postgresDB } = require('../config/database');
const { initializeModels } = require('../models');

const checkCategories = async () => {
  try {
    console.log('Connecting to the database...');
    await connectDatabases();
    const { Category } = initializeModels();
    console.log('Fetching all categories from the database...');

    const categories = await Category.findAll({
      attributes: ['name', 'slug', 'is_active', 'sort_order'],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    if (categories.length === 0) {
      console.log('No categories found in the database.');
    } else {
      console.log('Found categories:');
      console.table(categories.map(c => c.toJSON()));
    }

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Close the database connection
    const sequelize = postgresDB();
    if (sequelize) {
      await sequelize.close();
    }
    process.exit(0);
  }
};

checkCategories();

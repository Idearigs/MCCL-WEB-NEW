/**
 * Migration Runner Script
 *
 * Usage: node run-migration.js
 */

require('dotenv').config();
const { connectDatabases, postgresDB, closeDatabases } = require('./config/database');

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await connectDatabases();

    const sequelize = postgresDB();
    if (!sequelize) {
      throw new Error('Database connection failed');
    }

    console.log('Database connection established successfully.');

    // Import and run migration
    const migration = require('./migrations/create-jewelry-categories');

    console.log('\n========================================');
    console.log('Running Migration: Create Jewelry Categories');
    console.log('========================================\n');

    await migration.up();

    console.log('\n========================================');
    console.log('Migration completed successfully!');
    console.log('========================================\n');

    await closeDatabases();
    process.exit(0);
  } catch (error) {
    console.error('\n========================================');
    console.error('Migration failed with error:');
    console.error('========================================');
    console.error(error);
    console.error('\n');
    await closeDatabases().catch(console.error);
    process.exit(1);
  }
}

// Run migration
runMigration();

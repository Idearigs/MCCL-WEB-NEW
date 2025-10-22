/**
 * Migration Runner for Nivoda Integration
 *
 * Usage: node run-nivoda-migration.js
 */

require('dotenv').config();
const { connectDatabases, postgresDB, closeDatabases } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runNivodaMigration() {
  try {
    console.log('Connecting to database...');
    await connectDatabases();

    const sequelize = postgresDB();
    if (!sequelize) {
      throw new Error('Database connection failed');
    }

    console.log('Database connection established successfully.');

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'migrations', '009_add_nivoda_integration_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n========================================');
    console.log('Running Migration: Add Nivoda Integration Fields');
    console.log('========================================\n');

    // Execute the SQL migration
    await sequelize.query(migrationSQL);

    console.log('\n========================================');
    console.log('Migration completed successfully!');
    console.log('Added Nivoda integration fields to products table:');
    console.log('  - nivoda_enabled (BOOLEAN)');
    console.log('  - show_stone_type (BOOLEAN)');
    console.log('  - show_carat (BOOLEAN)');
    console.log('  - show_clarity (BOOLEAN)');
    console.log('  - show_colour (BOOLEAN)');
    console.log('  - show_cut (BOOLEAN)');
    console.log('  - show_certificate (BOOLEAN)');
    console.log('  - certificate (VARCHAR)');
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
runNivodaMigration();

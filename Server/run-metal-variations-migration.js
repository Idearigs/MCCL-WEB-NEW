/**
 * Migration Runner for Metal Variations Feature
 *
 * Usage: node run-metal-variations-migration.js
 */

require('dotenv').config();
const { connectDatabases, postgresDB, closeDatabases } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMetalVariationsMigration() {
  try {
    console.log('Connecting to database...');
    await connectDatabases();

    const sequelize = postgresDB();
    if (!sequelize) {
      throw new Error('Database connection failed');
    }

    console.log('Database connection established successfully.');

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'migrations', '010_add_metal_id_to_media.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n========================================');
    console.log('Running Migration: Add Metal Variations Support');
    console.log('========================================\n');

    // Execute the SQL migration
    await sequelize.query(migrationSQL);

    console.log('\n========================================');
    console.log('Migration completed successfully!');
    console.log('Added metal_id columns to media tables:');
    console.log('  - product_images.metal_id (UUID, optional)');
    console.log('  - product_videos.metal_id (UUID, optional)');
    console.log('\nFeatures enabled:');
    console.log('  ✓ Admin can upload different images per metal type');
    console.log('  ✓ Admin can upload different videos per metal type');
    console.log('  ✓ Customers see metal-appropriate media when selecting metals');
    console.log('  ✓ Backward compatible with non-metal-specific media');
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
runMetalVariationsMigration();

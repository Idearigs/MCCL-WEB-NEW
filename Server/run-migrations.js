#!/usr/bin/env node
/**
 * Migration Runner
 * Usage: node run-migrations.js [up|down|status]
 */

const fs = require('fs');
const path = require('path');
const { connectDatabases, postgresDB, logger } = require('./config/database');

const migrationsDir = path.join(__dirname, 'migrations');

async function runMigrations(direction = 'up') {
  try {
    console.log('Connecting to database...');
    const dbConnected = await connectDatabases();

    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    const sequelize = postgresDB();
    if (!sequelize) {
      throw new Error('Sequelize instance not available');
    }

    // Get list of migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    console.log(`\n📁 Found ${migrationFiles.length} migration file(s):\n`);
    migrationFiles.forEach(file => console.log(`   - ${file}`));

    // Run migrations
    for (const file of migrationFiles) {
      const migration = require(path.join(migrationsDir, file));
      console.log(`\n▶️  Running migration: ${file}`);

      try {
        if (direction === 'up' && migration.up) {
          await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
          console.log(`✅ ${file} - UP completed`);
        } else if (direction === 'down' && migration.down) {
          await migration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
          console.log(`✅ ${file} - DOWN completed`);
        }
      } catch (error) {
        console.error(`❌ ${file} failed:`, error.message);
        throw error;
      }
    }

    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

// Get direction from CLI arguments
const direction = process.argv[2] || 'up';

if (!['up', 'down'].includes(direction)) {
  console.error('Usage: node run-migrations.js [up|down]');
  process.exit(1);
}

runMigrations(direction);

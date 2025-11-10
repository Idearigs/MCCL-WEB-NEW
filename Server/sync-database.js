#!/usr/bin/env node
/**
 * Database Sync Script
 * Run this script to sync database schema with models
 * Usage: node sync-database.js [--force]
 *
 * Options:
 *   --force    Drop all tables and recreate (use with caution!)
 */

const { connectDatabases, postgresDB, logger } = require('./config/database');

async function syncDatabase() {
  try {
    console.log('Connecting to database...');
    await connectDatabases();

    const db = postgresDB();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const args = process.argv.slice(2);
    const isForce = args.includes('--force');

    if (isForce) {
      console.warn('⚠️  WARNING: This will DROP ALL TABLES and recreate them!');
      console.warn('⚠️  All data will be lost!');
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('Are you sure? (yes/no): ', async (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'yes') {
          console.log('Starting force sync (DROP and recreate)...');
          await db.sync({ force: true });
          console.log('✓ Database force synced successfully');
          process.exit(0);
        } else {
          console.log('Cancelled');
          process.exit(1);
        }
      });
    } else {
      console.log('Starting database sync (ALTER tables)...');
      await db.sync({ alter: true });
      console.log('✓ Database synced successfully');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error syncing database:', error.message);
    process.exit(1);
  }
}

syncDatabase();

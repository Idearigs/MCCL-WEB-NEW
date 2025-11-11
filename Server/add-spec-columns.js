#!/usr/bin/env node
/**
 * Add missing specification columns to watch_specifications table
 * Run this while server is running with: npm run add-spec-columns
 */

require('dotenv').config();
const { Client } = require('pg');

async function addSpecColumns() {
  const client = new Client({
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'mcculloch_db',
    user: process.env.PG_USERNAME || 'postgres',
    password: process.env.PG_PASSWORD || '',
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    console.log('🔄 Adding missing specification columns...\n');

    const columnsToAdd = [
      { name: 'case_shape', definition: 'VARCHAR(100)' },
      { name: 'case_weight', definition: 'VARCHAR(50)' },
      { name: 'dial_colour', definition: 'VARCHAR(100)' },
      { name: 'dial_crystal', definition: 'VARCHAR(100)' },
      { name: 'dial_hands_count', definition: 'VARCHAR(50)' },
      { name: 'strap_width', definition: 'VARCHAR(50)' },
      { name: 'movement_name', definition: 'VARCHAR(100)' },
      { name: 'movement_battery_type', definition: 'VARCHAR(100)' },
      { name: 'movement_manufacturing', definition: 'VARCHAR(255)' },
      { name: 'additional_features', definition: 'TEXT' },
      { name: 'watertightness', definition: 'VARCHAR(100)' }
    ];

    for (const column of columnsToAdd) {
      try {
        await client.query(
          `ALTER TABLE watch_specifications ADD COLUMN IF NOT EXISTS ${column.name} ${column.definition}`
        );
        console.log(`✓ Added column: ${column.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ Column already exists: ${column.name}`);
        } else if (error.message.includes('duplicate column')) {
          console.log(`ℹ Column already exists: ${column.name}`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ All specification columns added successfully!');
    console.log('='.repeat(80));
    console.log('\n📝 New columns added to watch_specifications table:');
    columnsToAdd.forEach(col => {
      console.log(`   ✓ ${col.name} (${col.definition})`);
    });
    console.log('\n💡 The server will automatically use these new columns.');
    console.log('📍 Go back to admin panel and update a watch to save specifications!\n');

    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    console.error('\nDebugging info:');
    console.error('  PG_HOST:', process.env.PG_HOST);
    console.error('  PG_DATABASE:', process.env.PG_DATABASE);
    console.error('  PG_USERNAME:', process.env.PG_USERNAME);
    process.exit(1);
  }
}

addSpecColumns();

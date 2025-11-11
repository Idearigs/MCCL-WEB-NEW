#!/usr/bin/env node
/**
 * Check all watch-related database tables (Direct connection)
 * Run with: node check-watch-tables-direct.js
 */

require('dotenv').config();
const { Client } = require('pg');

async function checkWatchTables() {
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

    console.log('\n📊 WATCH MANAGEMENT DATABASE SCHEMA\n');
    console.log('=' .repeat(120));

    // Get all watch-related tables
    const tables = [
      'watch_brands',
      'watch_collections',
      'watches',
      'watch_images',
      'watch_videos',
      'watch_specifications',
      'watch_variants'
    ];

    for (const tableName of tables) {
      try {
        // Get table info
        const columnsResult = await client.query(`
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);

        // Get table row count
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const count = countResult.rows[0].count;

        console.log(`\n📋 TABLE: ${tableName.toUpperCase()}`);
        console.log(`   📊 Records: ${count}`);
        console.log(`\n   COLUMNS:`);
        console.log('   ' + '-'.repeat(110));

        columnsResult.rows.forEach((col, index) => {
          const nullable = col.is_nullable === 'YES' ? '✓' : '✗';
          const defaultVal = col.column_default ? ` = ${col.column_default}` : '';
          const paddedName = col.column_name.padEnd(30);
          const paddedType = col.data_type.padEnd(20);
          console.log(`   ${(index + 1).toString().padEnd(2)}. ${paddedName} ${paddedType} (NULL: ${nullable})${defaultVal}`);
        });

        console.log('   ' + '-'.repeat(110));

      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`\n⚠️  TABLE: ${tableName.toUpperCase()} - DOES NOT EXIST`);
        } else {
          console.log(`\n⚠️  TABLE: ${tableName.toUpperCase()} - ERROR`);
          console.log(`    ${error.message}`);
        }
      }
    }

    // Get relationships/foreign keys
    console.log('\n\n🔗 FOREIGN KEY RELATIONSHIPS\n');
    console.log('=' .repeat(120));

    const fkResult = await client.query(`
      SELECT
        constraint_name,
        table_name,
        column_name,
        referenced_table_name,
        referenced_column_name
      FROM information_schema.key_column_usage
      WHERE table_schema = 'public'
        AND (table_name LIKE 'watch%' OR referenced_table_name LIKE 'watch%')
        AND referenced_table_name IS NOT NULL
      ORDER BY table_name, column_name
    `);

    if (fkResult.rows.length > 0) {
      fkResult.rows.forEach(fk => {
        console.log(`\n   ${fk.table_name}.${fk.column_name}`);
        console.log(`   └─> ${fk.referenced_table_name}.${fk.referenced_column_name}`);
      });
    } else {
      console.log('\n   No foreign key relationships found');
    }

    // Check for missing columns in watch_specifications
    console.log('\n\n📋 WATCH_SPECIFICATIONS COLUMNS\n');
    console.log('=' .repeat(120));

    const specResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'watch_specifications'
      ORDER BY column_name
    `);

    const specColumnNames = specResult.rows.map(c => c.column_name);

    const requiredColumns = [
      'case_shape',
      'case_weight',
      'dial_colour',
      'dial_crystal',
      'dial_hands_count',
      'strap_width',
      'movement_name',
      'movement_battery_type',
      'movement_manufacturing',
      'additional_features',
      'watertightness'
    ];

    const missing = requiredColumns.filter(col => !specColumnNames.includes(col));
    const present = requiredColumns.filter(col => specColumnNames.includes(col));

    console.log('\n   ✅ REQUIRED COLUMNS - PRESENT:');
    if (present.length > 0) {
      present.forEach(col => console.log(`      ✓ ${col}`));
    } else {
      console.log(`      (none)`);
    }

    console.log('\n   ❌ REQUIRED COLUMNS - MISSING:');
    if (missing.length > 0) {
      missing.forEach(col => console.log(`      ✗ ${col}`));
      console.log('\n   ⚡ ACTION REQUIRED: Run: npm run add-spec-columns');
    } else {
      console.log('      None! All required columns are present. ✅');
    }

    // Show all columns in watch_specifications
    console.log('\n\n   📊 ALL COLUMNS IN watch_specifications:');
    console.log('   ' + '-'.repeat(110));
    specColumnNames.forEach((col, idx) => {
      const status = requiredColumns.includes(col) ? '✓' : '○';
      console.log(`      ${status} ${col}`);
    });

    console.log('\n' + '=' .repeat(120) + '\n');

    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    console.error('\nCheck your .env file:');
    console.error('  PG_HOST:', process.env.PG_HOST);
    console.error('  PG_PORT:', process.env.PG_PORT);
    console.error('  PG_DATABASE:', process.env.PG_DATABASE);
    console.error('  PG_USERNAME:', process.env.PG_USERNAME);
    process.exit(1);
  }
}

checkWatchTables();

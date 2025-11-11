#!/usr/bin/env node
/**
 * Check all watch-related database tables and their schemas
 * Run with: node check-watch-tables.js
 */

const { postgresDB } = require('./config/database');

async function checkWatchTables() {
  try {
    const sequelize = postgresDB();

    if (!sequelize) {
      console.error('❌ Database not initialized. Start the server first with: npm run dev');
      process.exit(1);
    }

    console.log('\n📊 WATCH MANAGEMENT DATABASE SCHEMA\n');
    console.log('=' .repeat(100));

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
        const [columns] = await sequelize.query(`
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position
        `);

        // Get table row count
        const [countResult] = await sequelize.query(
          `SELECT COUNT(*) as count FROM "${tableName}"`
        );

        console.log(`\n📋 TABLE: ${tableName.toUpperCase()}`);
        console.log(`   Records: ${countResult[0].count}`);
        console.log(`\n   COLUMNS:`);
        console.log('   ' + '-'.repeat(90));

        columns.forEach((col, index) => {
          const nullable = col.is_nullable === 'YES' ? '✓' : '✗';
          const defaultVal = col.column_default ? ` = ${col.column_default}` : '';
          console.log(`   ${index + 1}. ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} (NULL: ${nullable})${defaultVal}`);
        });

        console.log('   ' + '-'.repeat(90));

      } catch (error) {
        console.log(`\n⚠️  TABLE: ${tableName.toUpperCase()} - ERROR`);
        console.log(`    ${error.message}`);
      }
    }

    // Get relationships/foreign keys
    console.log('\n\n🔗 FOREIGN KEY RELATIONSHIPS\n');
    console.log('=' .repeat(100));

    const [foreignKeys] = await sequelize.query(`
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

    if (foreignKeys.length > 0) {
      foreignKeys.forEach(fk => {
        console.log(`\n   ${fk.table_name}.${fk.column_name}`);
        console.log(`   └─> ${fk.referenced_table_name}.${fk.referenced_column_name}`);
      });
    } else {
      console.log('\n   No foreign key relationships found');
    }

    // Check for missing columns in watch_specifications
    console.log('\n\n⚠️  MISSING COLUMNS IN watch_specifications\n');
    console.log('=' .repeat(100));

    const [specColumns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'watch_specifications'
      ORDER BY column_name
    `);

    const specColumnNames = specColumns.map(c => c.column_name);

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

    console.log('\n   ✅ PRESENT:');
    present.forEach(col => console.log(`      ✓ ${col}`));

    console.log('\n   ❌ MISSING:');
    if (missing.length > 0) {
      missing.forEach(col => console.log(`      ✗ ${col}`));
      console.log('\n   ⚡ Run: npm run add-spec-columns');
    } else {
      console.log('      None! All columns are present.');
    }

    console.log('\n' + '=' .repeat(100) + '\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    console.error('\nMake sure:');
    console.error('1. Server is running: npm run dev');
    console.error('2. Database is connected');
    process.exit(1);
  }
}

checkWatchTables();

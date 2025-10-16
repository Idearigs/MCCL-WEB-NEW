const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.PG_PORT || process.env.DB_PORT || 5432,
  database: process.env.PG_DATABASE || process.env.DB_NAME || 'mcculloch_jewellers',
  user: process.env.PG_USERNAME || process.env.DB_USER || 'postgres',
  password: process.env.PG_PASSWORD || process.env.DB_PASSWORD || ''
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting jewelry category management migration...');

    // Enable UUID extension if not already enabled
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension enabled');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/007_jewelry_category_management.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');

    // Execute the migration
    await client.query(migrationSQL);
    console.log('✅ Jewelry category management migration completed successfully');

    // Verify the new tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('jewelry_types', 'jewelry_sub_types', 'earring_types', 'necklace_types', 'bracelet_types')
      ORDER BY table_name
    `);

    console.log('\n📋 Created tables:');
    tables.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Count seeded data
    const jewelryTypesCount = await client.query('SELECT COUNT(*) FROM jewelry_types');
    const jewelrySubTypesCount = await client.query('SELECT COUNT(*) FROM jewelry_sub_types');
    const earringTypesCount = await client.query('SELECT COUNT(*) FROM earring_types');
    const necklaceTypesCount = await client.query('SELECT COUNT(*) FROM necklace_types');
    const braceletTypesCount = await client.query('SELECT COUNT(*) FROM bracelet_types');

    console.log('\n📊 Seeded data:');
    console.log(`   ✓ Jewelry Types: ${jewelryTypesCount.rows[0].count} (Rings, Earrings, Necklaces, Bracelets)`);
    console.log(`   ✓ Jewelry Sub Types: ${jewelrySubTypesCount.rows[0].count} (Engagement, Wedding)`);
    console.log(`   ✓ Earring Types: ${earringTypesCount.rows[0].count}`);
    console.log(`   ✓ Necklace Types: ${necklaceTypesCount.rows[0].count}`);
    console.log(`   ✓ Bracelet Types: ${braceletTypesCount.rows[0].count}`);

    console.log('\n✨ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

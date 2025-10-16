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
    console.log('🔄 Starting separate engagement/wedding categories migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/008_separate_engagement_wedding_categories.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');

    // Execute the migration
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully');

    // Verify the new tables and data
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('jewelry_sub_type_ring_types', 'jewelry_sub_type_gemstones', 'jewelry_sub_type_metals', 'jewelry_sub_type_collections')
      ORDER BY table_name
    `);

    console.log('\n📋 Created junction tables:');
    tables.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Check linked data
    const engagementCount = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM jewelry_sub_type_ring_types WHERE jewelry_sub_type_id = (SELECT id FROM jewelry_sub_types WHERE slug = 'engagement-rings')) as ring_types,
        (SELECT COUNT(*) FROM jewelry_sub_type_gemstones WHERE jewelry_sub_type_id = (SELECT id FROM jewelry_sub_types WHERE slug = 'engagement-rings')) as gemstones,
        (SELECT COUNT(*) FROM jewelry_sub_type_metals WHERE jewelry_sub_type_id = (SELECT id FROM jewelry_sub_types WHERE slug = 'engagement-rings')) as metals,
        (SELECT COUNT(*) FROM jewelry_sub_type_collections WHERE jewelry_sub_type_id = (SELECT id FROM jewelry_sub_types WHERE slug = 'engagement-rings')) as collections
    `);

    const weddingCount = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM jewelry_sub_type_ring_types WHERE jewelry_sub_type_id = (SELECT id FROM jewelry_sub_types WHERE slug = 'wedding-rings')) as ring_types,
        (SELECT COUNT(*) FROM jewelry_sub_type_gemstones WHERE jewelry_sub_type_id = (SELECT id FROM jewelry_sub_types WHERE slug = 'wedding-rings')) as gemstones,
        (SELECT COUNT(*) FROM jewelry_sub_type_metals WHERE jewelry_sub_type_id = (SELECT id FROM jewelry_sub_types WHERE slug = 'wedding-rings')) as metals,
        (SELECT COUNT(*) FROM jewelry_sub_type_collections WHERE jewelry_sub_type_id = (SELECT id FROM jewelry_sub_types WHERE slug = 'wedding-rings')) as collections
    `);

    console.log('\n📊 Engagement Rings linked items:');
    console.log(`   ✓ Ring Types: ${engagementCount.rows[0].ring_types}`);
    console.log(`   ✓ Gemstones: ${engagementCount.rows[0].gemstones}`);
    console.log(`   ✓ Metals: ${engagementCount.rows[0].metals}`);
    console.log(`   ✓ Collections: ${engagementCount.rows[0].collections}`);

    console.log('\n📊 Wedding Rings linked items:');
    console.log(`   ✓ Ring Types: ${weddingCount.rows[0].ring_types}`);
    console.log(`   ✓ Gemstones: ${weddingCount.rows[0].gemstones}`);
    console.log(`   ✓ Metals: ${weddingCount.rows[0].metals}`);
    console.log(`   ✓ Collections: ${weddingCount.rows[0].collections}`);

    console.log('\n✨ Now Engagement and Wedding rings have separate category management!');

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

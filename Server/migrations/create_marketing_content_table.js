/**
 * Migration: Create marketing_content table
 * This table stores special product release announcements and design releases
 * Run: node migrations/create_marketing_content_table.js
 */

require('dotenv').config();
const pool = require('../config/pool');

async function createMarketingContentTable() {
  try {
    console.log('Starting migration: Create marketing_content table...\n');

    // Create the marketing_content table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        video_url VARCHAR(500),
        thumbnail_image VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✓ marketing_content table created successfully');

    // Create indexes for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_marketing_content_is_active
      ON marketing_content(is_active);
    `);
    console.log('✓ Index on is_active created');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_marketing_content_is_featured
      ON marketing_content(is_featured);
    `);
    console.log('✓ Index on is_featured created');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_marketing_content_product_id
      ON marketing_content(product_id);
    `);
    console.log('✓ Index on product_id created');

    // Add table comment
    await pool.query(`
      COMMENT ON TABLE marketing_content IS
      'Stores special product releases and design announcements for home page marketing section';
    `);
    console.log('✓ Table comment added');

    console.log('\n✓ Migration completed successfully!');
    console.log('The marketing_content table is now ready to use.\n');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

createMarketingContentTable();

/**
 * Schema Enhancement: Add performance indexes and fix missing DEFAULT NOW()
 *
 * Safe to re-run (uses IF NOT EXISTS). Non-destructive.
 *
 * Note: CONCURRENTLY cannot run inside a transaction block.
 *
 * Usage:
 *   node Server/scripts/add-indexes.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD
});

async function addIndexes() {
  const client = await pool.connect();
  try {
    const indexes = [
      {
        name: 'idx_products_category_id',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_id ON products(category_id)'
      },
      {
        name: 'idx_products_base_price',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_base_price ON products(base_price)'
      },
      {
        name: 'idx_metal_junction_metal_id',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metal_junction_metal_id ON product_metals_junction(metal_id)'
      },
      {
        name: 'idx_ring_types_junction',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ring_types_junction ON product_ring_types(ring_type_id)'
      },
      {
        name: 'idx_variants_metal_id',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_variants_metal_id ON product_variants(metal_id)'
      },
      {
        name: 'idx_variants_product_id',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_variants_product_id ON product_variants(product_id)'
      }
    ];

    for (const index of indexes) {
      console.log(`Creating index ${index.name}...`);
      await client.query(index.sql);
      console.log(`  Done.`);
    }

    // Fix missing DEFAULT NOW() on junction tables
    console.log('Fixing DEFAULT NOW() on product_metals_junction...');
    await client.query(`
      ALTER TABLE product_metals_junction
        ALTER COLUMN created_at SET DEFAULT NOW(),
        ALTER COLUMN updated_at SET DEFAULT NOW()
    `);

    console.log('Fixing DEFAULT NOW() on product_ring_types...');
    await client.query(`
      ALTER TABLE product_ring_types
        ALTER COLUMN created_at SET DEFAULT NOW(),
        ALTER COLUMN updated_at SET DEFAULT NOW()
    `);

    console.log('All indexes created and defaults fixed.');
  } catch (err) {
    console.error('Index creation failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

addIndexes().catch(err => {
  console.error(err);
  process.exit(1);
});

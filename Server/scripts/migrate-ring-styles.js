/**
 * Migration: ring_style_1..5_id columns → product_ring_types junction table
 *
 * Run ONCE before deploying code changes. Safe to re-run (idempotent).
 *
 * Usage:
 *   node Server/scripts/migrate-ring-styles.js
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

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Migrate ring_style_1..5 FK columns → product_ring_types junction table
    console.log('Migrating ring_style_1..5 data to product_ring_types junction table...');
    const migrateResult = await client.query(`
      INSERT INTO product_ring_types (id, product_id, ring_type_id, created_at, updated_at)
      SELECT
        gen_random_uuid(),
        p.id,
        rs.ring_type_id,
        NOW(),
        NOW()
      FROM products p
      CROSS JOIN LATERAL (
        VALUES
          (p.ring_style_1_id),
          (p.ring_style_2_id),
          (p.ring_style_3_id),
          (p.ring_style_4_id),
          (p.ring_style_5_id)
      ) AS rs(ring_type_id)
      WHERE rs.ring_type_id IS NOT NULL
      ON CONFLICT (product_id, ring_type_id) DO NOTHING
    `);
    console.log(`Inserted ${migrateResult.rowCount} rows into product_ring_types`);

    // 2. Verify migration
    const verifyResult = await client.query(`
      SELECT COUNT(*) AS total FROM product_ring_types
    `);
    console.log(`Total rows in product_ring_types: ${verifyResult.rows[0].total}`);

    // 3. Drop the 5 redundant FK columns
    console.log('Dropping ring_style_1..5_id columns from products table...');
    await client.query(`
      ALTER TABLE products
        DROP COLUMN IF EXISTS ring_style_1_id,
        DROP COLUMN IF EXISTS ring_style_2_id,
        DROP COLUMN IF EXISTS ring_style_3_id,
        DROP COLUMN IF EXISTS ring_style_4_id,
        DROP COLUMN IF EXISTS ring_style_5_id
    `);
    console.log('Columns dropped successfully.');

    await client.query('COMMIT');
    console.log('Migration complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});

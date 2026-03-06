/**
 * Migration: Remove legacy direct FK columns from products table
 *
 * Removes ambiguous duplicate columns that have been superseded by junction tables:
 *   - ring_type_id    → product_ring_types (M:N junction)
 *   - stone_shape_id  → product_stone_shapes (M:N junction)
 *   - stone_type_id   → product_stone_types (M:N junction)
 *
 * Before dropping, migrates any existing stone_type_id data into product_stone_types.
 * ring_type_id and stone_shape_id are never written to by any controller, so no migration needed.
 *
 * Safe to re-run (uses IF EXISTS). Non-destructive (migrate-first).
 *
 * Usage:
 *   node Server/scripts/drop-legacy-fk-columns.js
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

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── 1. Migrate stone_type_id → product_stone_types ─────────────────────
    // Only needed if the column still exists
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'stone_type_id'
    `);

    if (colCheck.rows.length > 0) {
      const { rows: migrated } = await client.query(`
        INSERT INTO product_stone_types (id, product_id, stone_type_id, created_at, updated_at)
        SELECT gen_random_uuid(), id, stone_type_id, NOW(), NOW()
        FROM products
        WHERE stone_type_id IS NOT NULL
        ON CONFLICT (product_id, stone_type_id) DO NOTHING
        RETURNING product_id
      `);
      console.log(`Migrated ${migrated.length} stone_type_id rows → product_stone_types`);
    } else {
      console.log('stone_type_id column already dropped — skipping migration');
    }

    // ── 2. Drop the three legacy columns ───────────────────────────────────
    console.log('Dropping legacy FK columns from products...');
    await client.query(`
      ALTER TABLE products
        DROP COLUMN IF EXISTS ring_type_id,
        DROP COLUMN IF EXISTS stone_shape_id,
        DROP COLUMN IF EXISTS stone_type_id
    `);
    console.log('  ring_type_id    → dropped');
    console.log('  stone_shape_id  → dropped');
    console.log('  stone_type_id   → dropped');

    await client.query('COMMIT');
    console.log('Done. Junction tables are now the single source of truth.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

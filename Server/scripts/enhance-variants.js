/**
 * Schema Enhancement: Add new columns to product_variants table
 *
 * Safe to re-run (uses ADD COLUMN IF NOT EXISTS). Non-destructive.
 *
 * Usage:
 *   node Server/scripts/enhance-variants.js
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

async function enhance() {
  const client = await pool.connect();
  try {
    console.log('Adding new columns to product_variants...');
    await client.query(`
      ALTER TABLE product_variants
        ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NULL,
        ADD COLUMN IF NOT EXISTS carat_weight DECIMAL(5,3) NULL,
        ADD COLUMN IF NOT EXISTS mm_width DECIMAL(5,2) NULL,
        ADD COLUMN IF NOT EXISTS metal_id UUID NULL REFERENCES product_metals(id),
        ADD COLUMN IF NOT EXISTS ai_description TEXT NULL
    `);
    console.log('product_variants enhanced successfully.');

    // Verify
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'product_variants'
        AND column_name IN ('price', 'carat_weight', 'mm_width', 'metal_id', 'ai_description')
      ORDER BY column_name
    `);
    console.log('New columns confirmed:');
    result.rows.forEach(row => console.log(`  ${row.column_name}: ${row.data_type}`));
  } catch (err) {
    console.error('Enhancement failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

enhance().catch(err => {
  console.error(err);
  process.exit(1);
});

/**
 * Migration: Add mount_price to product_metals_junction
 * Run: node Server/scripts/add-metal-mount-prices.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migration: add mount_price to product_metals_junction...');

    await client.query(`
      ALTER TABLE product_metals_junction
      ADD COLUMN IF NOT EXISTS mount_price DECIMAL(10,2) DEFAULT NULL;
    `);

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

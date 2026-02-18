/**
 * Migration: Add refresh token and device management fields to admin_sessions
 *
 * Run: node Server/scripts/migrate-admin-sessions.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'mcculloch_db',
  user: process.env.PG_USERNAME || 'postgres',
  password: process.env.PG_PASSWORD
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting admin_sessions migration...');

    // Add new columns (IF NOT EXISTS prevents errors on re-run)
    const columns = [
      { name: 'refresh_token_hash', sql: `ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS refresh_token_hash VARCHAR(255) UNIQUE` },
      { name: 'device_name', sql: `ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS device_name VARCHAR(255)` },
      { name: 'device_id', sql: `ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS device_id VARCHAR(255)` },
      { name: 'is_linked', sql: `ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS is_linked BOOLEAN DEFAULT true` },
      { name: 'last_active_at', sql: `ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` },
    ];

    for (const col of columns) {
      await client.query(col.sql);
      console.log(`  + ${col.name} column ensured`);
    }

    // Set default values for existing rows
    await client.query(`UPDATE admin_sessions SET device_name = 'Legacy Device' WHERE device_name IS NULL`);
    await client.query(`UPDATE admin_sessions SET last_active_at = updated_at WHERE last_active_at IS NULL`);

    console.log('\nMigration completed successfully!');

    // Show current state
    const result = await client.query(`SELECT COUNT(*) as count FROM admin_sessions WHERE is_active = true`);
    console.log(`Active sessions: ${result.rows[0].count}`);
  } catch (err) {
    console.error('Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));

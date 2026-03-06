/**
 * Migration: Create chat_labels and chat_label_assignments tables
 *
 * Safe to re-run (uses IF NOT EXISTS). Non-destructive.
 *
 * Usage:
 *   node Server/scripts/create-chat-labels.js
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

    console.log('Creating chat_labels table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_labels (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(50) NOT NULL UNIQUE,
        color       VARCHAR(7)  NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    console.log('Creating chat_label_assignments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_label_assignments (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id    UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        label_id   UUID NOT NULL REFERENCES chat_labels(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (chat_id, label_id)
      )
    `);

    await client.query('COMMIT');
    console.log('Done. chat_labels and chat_label_assignments tables created.');
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

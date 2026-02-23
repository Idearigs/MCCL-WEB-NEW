const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'mcculloch_db',
  user: process.env.PG_USERNAME || 'postgres',
  password: process.env.PG_PASSWORD
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS watch_compatible_straps (
        watch_id     UUID NOT NULL REFERENCES watches(id) ON DELETE CASCADE,
        accessory_id UUID NOT NULL REFERENCES watch_accessories(id) ON DELETE CASCADE,
        PRIMARY KEY (watch_id, accessory_id)
      )
    `);
    console.log('✅ watch_compatible_straps table created');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

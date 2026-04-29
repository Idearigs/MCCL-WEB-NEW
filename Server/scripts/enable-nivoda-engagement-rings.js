/**
 * Enable Nivoda integration for all engagement ring products and set
 * standard diamond specification defaults.
 *
 * Run: node Server/scripts/enable-nivoda-engagement-rings.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.PG_HOST,
  port:     parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE,
  user:     process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
  ssl: false,
});

const NIVODA_DEFAULTS = {
  stoneType: 'natural',
  caratRange: { min: 0.5, max: 2.0 },
  clarityOptions:     ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2'],
  colourOptions:      ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'],
  cutOptions:         [],
  polishOptions:      ['EX', 'VG', 'G'],
  symmetryOptions:    ['EX', 'VG', 'G'],
  fluorescenceOptions:[],
  certificateOptions: ['GIA', 'IGI', 'HRD', 'GCAL', 'EGL', 'DBIOD', 'GSI', 'SGL', 'AGS', 'EGLISR'],
};

async function main() {
  const client = await pool.connect();
  try {
    // Locate the engagement-rings jewelry sub type
    const subtypeRes = await client.query(
      `SELECT id, name FROM jewelry_sub_types WHERE slug = 'engagement-rings' LIMIT 1`
    );
    if (subtypeRes.rows.length === 0) {
      console.error('No engagement-rings sub type found in jewelry_sub_types.');
      return;
    }
    const subtypeId = subtypeRes.rows[0].id;
    console.log(`Engagement rings sub type: ${subtypeRes.rows[0].name} (${subtypeId})`);

    // Count total engagement ring products
    const countRes = await client.query(
      `SELECT COUNT(*) FROM products WHERE jewelry_sub_type_id = $1`,
      [subtypeId]
    );
    const total = parseInt(countRes.rows[0].count);
    console.log(`Total engagement ring products: ${total}`);

    // Count how many already have Nivoda enabled
    const alreadyRes = await client.query(
      `SELECT COUNT(*) FROM products WHERE jewelry_sub_type_id = $1 AND nivoda_enabled = true`,
      [subtypeId]
    );
    const alreadyEnabled = parseInt(alreadyRes.rows[0].count);
    console.log(`Already Nivoda-enabled: ${alreadyEnabled}`);
    console.log(`To be updated: ${total - alreadyEnabled} (+ ${total} to receive fresh defaults)\n`);

    // Update ALL engagement ring products:
    // - Enable Nivoda
    // - Set standard options (overwrite existing config)
    const updateRes = await client.query(
      `UPDATE products
       SET
         nivoda_enabled        = true,
         nivoda_options_config = $1::jsonb,
         updated_at            = NOW()
       WHERE jewelry_sub_type_id = $2
       RETURNING sku, name, nivoda_enabled`,
      [JSON.stringify(NIVODA_DEFAULTS), subtypeId]
    );

    console.log(`Updated ${updateRes.rowCount} products:\n`);
    updateRes.rows.forEach(r => {
      console.log(`  ${r.sku.padEnd(10)} ${r.name}`);
    });

    console.log(`\nDone. All ${updateRes.rowCount} engagement ring products now have Nivoda enabled with standard defaults.`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

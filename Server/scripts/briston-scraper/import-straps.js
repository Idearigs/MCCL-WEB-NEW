#!/usr/bin/env node
/**
 * Briston Straps Importer
 * -----------------------
 * Creates watch_accessories table if needed and imports straps from straps.json
 */

const { Pool } = require('pg');
const path = require('path');
const fs   = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  host:     process.env.PG_HOST     || 'localhost',
  port:     parseInt(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'mcculloch_db',
  user:     process.env.PG_USERNAME || 'postgres',
  password: process.env.PG_PASSWORD
});

const STRAPS_JSON = path.join(__dirname, 'output', 'straps', 'straps.json');
const IMAGES_SRC  = path.join(__dirname, 'output', 'straps', 'images');
const IMAGES_DEST = path.join(__dirname, '../../uploads/watches/straps');

async function createTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS watch_accessories (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_id     UUID REFERENCES watch_brands(id) ON DELETE CASCADE,
      name         VARCHAR(255) NOT NULL,
      slug         VARCHAR(255) UNIQUE NOT NULL,
      shopify_handle VARCHAR(255),
      strap_type   VARCHAR(50),
      color        VARCHAR(100),
      width_mm     INTEGER,
      price_eur    DECIMAL(10,2),
      price_gbp    DECIMAL(10,2),
      image_url    VARCHAR(500),
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('  ✅ watch_accessories table ready');
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  Briston Straps Importer');
  console.log('═'.repeat(60));

  if (!fs.existsSync(STRAPS_JSON)) {
    console.error('  ❌ straps.json not found — run scrape-straps.js first');
    process.exit(1);
  }

  const data   = JSON.parse(fs.readFileSync(STRAPS_JSON));
  const straps = data.straps;
  console.log(`  Straps to import: ${straps.length}\n`);

  // Copy images to uploads dir
  fs.mkdirSync(IMAGES_DEST, { recursive: true });
  let copied = 0;
  straps.forEach(s => {
    if (!s.local_image) return;
    const src  = path.join(__dirname, 'output', 'straps', s.local_image);
    const ext  = path.extname(src);
    const dest = path.join(IMAGES_DEST, s.handle + ext);
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      copied++;
    }
  });
  console.log(`  Images copied: ${copied}\n`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create table
    await createTable(client);

    // Get Briston brand ID
    const brandRes = await client.query(`SELECT id FROM watch_brands WHERE name = 'Briston' LIMIT 1`);
    if (!brandRes.rows.length) {
      console.error('  ❌ Briston brand not found in DB — import watches first');
      process.exit(1);
    }
    const brandId = brandRes.rows[0].id;
    console.log(`  Brand ID: ${brandId}\n`);

    let created = 0, skipped = 0, failed = 0;

    for (const s of straps) {
      try {
        // Build image URL path
        let imageUrl = null;
        if (s.local_image) {
          const ext = path.extname(s.local_image);
          imageUrl = `/uploads/watches/straps/${s.handle}${ext}`;
        }

        await client.query(`
          INSERT INTO watch_accessories
            (brand_id, name, slug, shopify_handle, strap_type, color, width_mm, price_eur, price_gbp, image_url)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            strap_type = EXCLUDED.strap_type,
            color = EXCLUDED.color,
            width_mm = EXCLUDED.width_mm,
            price_eur = EXCLUDED.price_eur,
            price_gbp = EXCLUDED.price_gbp,
            image_url = COALESCE(EXCLUDED.image_url, watch_accessories.image_url),
            updated_at = NOW()
        `, [brandId, s.name, s.slug, s.handle, s.strap_type, s.color, s.width_mm, s.price_eur, s.price_gbp, imageUrl]);

        created++;
        process.stdout.write(`\r  Importing: ${created + skipped}/${straps.length} — ${s.name.substring(0,40)}`);
      } catch (e) {
        console.log(`\n  ⚠️  ${s.name}: ${e.message}`);
        failed++;
      }
    }

    await client.query('COMMIT');
    console.log(`\n\n${'═'.repeat(60)}`);
    console.log('  ✅ IMPORT COMPLETE');
    console.log('═'.repeat(60));
    console.log(`  Imported: ${created} | Failed: ${failed}`);
    console.log(`  Brand ID: ${brandId}\n`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });

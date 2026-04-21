/**
 * Fix missing White Gold (W) image DB records for BJ-001.
 * The image files already exist in uploads/products/BJ-001/ — this script
 * just inserts the missing product_images rows and links them to White Gold metal.
 *
 * Usage: node scripts/fix-bj001-white-gold-images.js [--dry-run]
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DRY_RUN = process.argv.includes('--dry-run');
const SKU = 'BJ-001';
const W_IMAGES = [
  { angle: 1, file: 'BJ-001-1-W.png', isPrimary: false, isMetalPreview: true },
  { angle: 2, file: 'BJ-001-2-W.png', isPrimary: false, isMetalPreview: false },
  { angle: 3, file: 'BJ-001-3-W.png', isPrimary: false, isMetalPreview: false },
  { angle: 4, file: 'BJ-001-4-W.png', isPrimary: false, isMetalPreview: false },
];

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
});

async function run() {
  console.log(DRY_RUN ? '🔍 DRY-RUN MODE\n' : '🚀 LIVE RUN\n');

  // 1. Find product
  const { rows: [product] } = await pool.query(
    `SELECT id, name FROM products WHERE sku = $1`, [SKU]
  );
  if (!product) { console.error(`Product ${SKU} not found`); process.exit(1); }
  console.log(`Product: ${product.name} (${product.id})`);

  // 2. Find White Gold metal
  const { rows: [metal] } = await pool.query(
    `SELECT id, name FROM product_metals WHERE name ILIKE 'White Gold' AND is_active = true LIMIT 1`
  );
  if (!metal) { console.error('White Gold metal not found in product_metals'); process.exit(1); }
  console.log(`Metal:   ${metal.name} (${metal.id})`);

  // 3. Check existing images for this product + metal
  const { rows: existing } = await pool.query(
    `SELECT image_url FROM product_images WHERE product_id = $1 AND metal_id = $2`,
    [product.id, metal.id]
  );
  console.log(`Existing W images in DB: ${existing.length}`);
  if (existing.length >= 4) {
    console.log('White Gold images already exist — nothing to do.');
    await pool.end();
    return;
  }

  // 4. Get current max sort_order for this product
  const { rows: [{ max_order }] } = await pool.query(
    `SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM product_images WHERE product_id = $1`,
    [product.id]
  );
  let sortOrder = parseInt(max_order) + 1;

  // 5. Insert missing W images
  for (const img of W_IMAGES) {
    const imageUrl = `/uploads/products/${SKU}/${img.file}`;
    const alreadyExists = existing.some(e => e.image_url === imageUrl);
    if (alreadyExists) { console.log(`  skip (exists): ${img.file}`); continue; }

    if (DRY_RUN) {
      console.log(`  [DRY-RUN] would insert: ${imageUrl}  sort=${sortOrder}  primary=${img.isPrimary}  metalPreview=${img.isMetalPreview}`);
    } else {
      await pool.query(`
        INSERT INTO product_images
          (id, product_id, image_url, alt_text, metal_id, sort_order,
           is_primary, is_metal_preview, is_diamond_size_preview, created_at, updated_at)
        VALUES
          (gen_random_uuid(), $1, $2, 'BJ-001 White Gold', $3, $4, $5, $6, false, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [product.id, imageUrl, metal.id, sortOrder, img.isPrimary, img.isMetalPreview]);
      console.log(`  ✅ inserted: ${img.file}  sort=${sortOrder}`);
    }
    sortOrder++;
  }

  console.log('\nDone.');
  await pool.end();
}

run().catch(async err => {
  console.error('Error:', err.message);
  await pool.end();
  process.exit(1);
});

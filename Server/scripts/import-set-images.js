/**
 * Import Set-1 / Set-2 / Set-3 Engagement Ring Images
 *
 * Source structure:
 *   Client/images/Engagement-rings/Set-{1,2,3}/BJ - {XXX}/BJ - {XXX}-{angle}-{metal}.png
 *
 * Naming:
 *   angle  = 1-4 (view angles)
 *   metal  = R (Rose Gold) | W (White Gold) | Y (Yellow Gold)
 *
 * What this script does:
 *   1. Copies images to Server/uploads/products/BJ-XXX/
 *   2. Inserts product_images rows (metal_id, sort_order, is_primary, is_metal_preview)
 *   3. Skips products not found in DB (e.g. BJ-022)
 *   4. ON CONFLICT DO NOTHING — safe to re-run
 *
 * Usage:
 *   node scripts/import-set-images.js            # live run
 *   node scripts/import-set-images.js --dry-run  # preview only
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DRY_RUN = process.argv.includes('--dry-run');

const SOURCE_ROOT = path.join(__dirname, '..', '..', 'Client', 'images', 'Engagement-rings');
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads', 'products');
const SETS = ['Set-1', 'Set-2', 'Set-3'];

const METAL_MAP = { R: 'Rose Gold', W: 'White Gold', Y: 'Yellow Gold' };

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
});

// ── helpers ──────────────────────────────────────────────────────────────────

/** "BJ - 001" → "BJ-001" */
function folderToSku(folderName) {
  return folderName.replace(/\s*-\s*/, '-').trim();
}

/** "BJ - 001-2-W.png" → { angle: 2, metalCode: 'W' } or null */
function parseFilename(filename) {
  const m = filename.match(/-(\d+)-([RWYrwy])\.(png|jpg|jpeg|webp)$/i);
  if (!m) return null;
  return { angle: parseInt(m[1], 10), metalCode: m[2].toUpperCase() };
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  if (DRY_RUN) {
    console.log(`    [DRY-RUN] copy → ${dest}`);
    return true;
  }
  try {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    return true;
  } catch (e) {
    console.error(`    ERROR copying file: ${e.message}`);
    return false;
  }
}

// ── DB queries ────────────────────────────────────────────────────────────────

async function getMetals() {
  const { rows } = await pool.query(`SELECT id, name FROM product_metals WHERE is_active = true`);
  const map = {};
  rows.forEach(r => { map[r.name] = r.id; });
  return map;
}

async function getProductBySku(sku) {
  const { rows } = await pool.query(`SELECT id, name FROM products WHERE sku = $1`, [sku]);
  return rows[0] || null;
}

async function insertImage(productId, imageUrl, metalId, sortOrder, isPrimary, isMetalPreview) {
  if (DRY_RUN) return 'dry-run';
  const { rows } = await pool.query(`
    INSERT INTO product_images
      (id, product_id, image_url, alt_text, metal_id, sort_order,
       is_primary, is_metal_preview, is_diamond_size_preview, created_at, updated_at)
    VALUES
      (gen_random_uuid(), $1, $2, 'Product image', $3, $4, $5, $6, false, NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id
  `, [productId, imageUrl, metalId, sortOrder, isPrimary, isMetalPreview]);
  return rows[0]?.id || null;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log(DRY_RUN ? '🔍 DRY-RUN MODE — no files/DB changes\n' : '🚀 LIVE RUN\n');

  const metals = await getMetals();
  console.log('Metals found:', Object.keys(metals).join(', '), '\n');

  let totalCopied = 0, totalInserted = 0, totalSkipped = 0;

  for (const setName of SETS) {
    const setDir = path.join(SOURCE_ROOT, setName);
    if (!fs.existsSync(setDir)) { console.warn(`⚠  Set folder not found: ${setDir}`); continue; }

    const productFolders = fs.readdirSync(setDir).sort();
    console.log(`\n── ${setName} (${productFolders.length} folders) ──`);

    for (const folder of productFolders) {
      const sku = folderToSku(folder);
      const product = await getProductBySku(sku);

      if (!product) {
        console.log(`  ⚠  ${sku} — not found in DB, skipping`);
        totalSkipped++;
        continue;
      }

      const folderPath = path.join(setDir, folder);
      const files = fs.readdirSync(folderPath).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f)).sort();

      if (files.length === 0) {
        console.log(`  ⚠  ${sku} — no image files found`);
        continue;
      }

      console.log(`  ${sku} — ${files.length} images`);

      // Track which angle-1 metal we've seen first (for is_primary)
      let productHasPrimary = false;
      // Track first image per metal (for is_metal_preview)
      const metalFirstSeen = new Set();

      // Sort: angle ASC, then metal code (R, W, Y)
      const sorted = files
        .map(f => ({ f, parsed: parseFilename(f) }))
        .filter(x => x.parsed)
        .sort((a, b) => {
          if (a.parsed.angle !== b.parsed.angle) return a.parsed.angle - b.parsed.angle;
          return a.parsed.metalCode.localeCompare(b.parsed.metalCode);
        });

      let sortOrder = 1;
      for (const { f, parsed } of sorted) {
        const { angle, metalCode } = parsed;
        const metalName = METAL_MAP[metalCode];
        const metalId = metals[metalName];

        if (!metalId) {
          console.warn(`    ⚠  No metal ID for code '${metalCode}' (${metalName})`);
          continue;
        }

        // Destination: uploads/products/BJ-001/BJ-001-1-R.png
        // Normalise filename: remove spaces from "BJ - 001-1-R.png" → "BJ-001-1-R.png"
        const cleanFilename = f.replace(/^BJ\s*-\s*(\d+)/, 'BJ-$1');
        const destDir = path.join(UPLOADS_ROOT, sku);
        const destPath = path.join(destDir, cleanFilename);
        const srcPath = path.join(folderPath, f);

        const copied = copyFile(srcPath, destPath);
        if (copied) totalCopied++;

        const imageUrl = `/uploads/products/${sku}/${cleanFilename}`;
        const isPrimary = !productHasPrimary && angle === 1;
        const isMetalPreview = !metalFirstSeen.has(metalCode) && angle === 1;

        if (isPrimary) productHasPrimary = true;
        if (isMetalPreview) metalFirstSeen.add(metalCode);

        const id = await insertImage(product.id, imageUrl, metalId, sortOrder, isPrimary, isMetalPreview);
        if (id) totalInserted++;

        sortOrder++;
      }
    }
  }

  console.log('\n─────────────────────────────────');
  console.log(`✅ Files copied  : ${totalCopied}`);
  console.log(`✅ DB rows added : ${totalInserted}`);
  console.log(`⚠  Products skipped: ${totalSkipped}`);
  await pool.end();
}

run().catch(async err => {
  console.error('Fatal error:', err.message);
  await pool.end();
  process.exit(1);
});

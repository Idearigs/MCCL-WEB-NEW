#!/usr/bin/env node
/**
 * Briston Watch Importer
 * ----------------------
 * Imports scraped Briston watch data into the McCulloch database.
 * Run AFTER the scraper has produced an import-ready.json file.
 *
 * Usage:
 *   node importer.js <path-to-import-ready.json> [options]
 *
 * Examples:
 *   node importer.js ./output/clubmaster-classic/import-ready.json
 *   node importer.js ./output/clubmaster-classic/import-ready.json --dry-run
 *   node importer.js ./output/clubmaster-classic/import-ready.json --brand-id <uuid>
 *
 * Options:
 *   --dry-run     Show what would be imported without writing to DB
 *   --brand-id    Use existing brand UUID (skip brand lookup/creation)
 *   --collection-id  Use existing collection UUID (skip collection creation)
 *   --skip-images Skip copying/registering images
 *   --update      Update existing watches (by handle/sku) instead of skipping
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const inputFile = args.find(a => !a.startsWith('--'));
const DRY_RUN = args.includes('--dry-run');
const SKIP_IMAGES = args.includes('--skip-images');
const UPDATE_EXISTING = args.includes('--update');

const brandIdIdx = args.indexOf('--brand-id');
const FORCE_BRAND_ID = brandIdIdx !== -1 ? args[brandIdIdx + 1] : null;

const collIdIdx = args.indexOf('--collection-id');
const FORCE_COLLECTION_ID = collIdIdx !== -1 ? args[collIdIdx + 1] : null;

// Server uploads path for watch images
const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'watches');

if (!inputFile) {
  console.error('\n❌  Usage: node importer.js <import-ready.json> [options]\n');
  console.error('   Example: node importer.js ./output/clubmaster-classic/import-ready.json\n');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`\n❌  File not found: ${inputFile}\n`);
  process.exit(1);
}

// ─── DB ───────────────────────────────────────────────────────────────────────
const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'mcculloch_db',
  user: process.env.PG_USERNAME || 'postgres',
  password: process.env.PG_PASSWORD
});

async function query(sql, params) {
  if (DRY_RUN && /^(INSERT|UPDATE|DELETE)/i.test(sql.trim())) {
    console.log(`  [DRY RUN] ${sql.trim().substring(0, 120)}`);
    return { rows: [{ id: 'dry-run-id' }] };
  }
  return pool.query(sql, params);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ýÿ]/g, 'y')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function eur2gbp(eurPrice) {
  // Approximate EUR→GBP conversion rate
  // The importer will set prices - adjust this rate or update manually
  const RATE = 0.86;
  return eurPrice ? Math.round(eurPrice * RATE * 100) / 100 : null;
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim();
}

// ─── BRAND ────────────────────────────────────────────────────────────────────
async function ensureBrand() {
  if (FORCE_BRAND_ID) {
    const res = await pool.query('SELECT id, name FROM watch_brands WHERE id = $1', [FORCE_BRAND_ID]);
    if (res.rows.length === 0) throw new Error(`Brand ID not found: ${FORCE_BRAND_ID}`);
    console.log(`  ✅ Using brand: ${res.rows[0].name} (${FORCE_BRAND_ID})`);
    return FORCE_BRAND_ID;
  }

  // Check if Briston already exists
  const existing = await pool.query(
    "SELECT id FROM watch_brands WHERE slug = 'briston' OR LOWER(name) = 'briston'"
  );
  if (existing.rows.length > 0) {
    console.log(`  ✅ Found existing Briston brand: ${existing.rows[0].id}`);
    return existing.rows[0].id;
  }

  // Create Briston brand
  const res = await query(
    `INSERT INTO watch_brands (id, name, slug, description, country_of_origin, is_active, sort_order, created_at, updated_at)
     VALUES (gen_random_uuid(), 'Briston', 'briston',
             'Briston watches combine French elegance with British spirit, featuring distinctive acetate cases and interchangeable straps.',
             'France', true, 100, NOW(), NOW())
     RETURNING id`,
    []
  );
  const brandId = res.rows[0].id;
  console.log(`  ✅ Created Briston brand: ${brandId}`);
  return brandId;
}

// ─── COLLECTION ───────────────────────────────────────────────────────────────
async function ensureCollection(brandId, collectionHandle, collectionName) {
  if (FORCE_COLLECTION_ID) {
    const res = await pool.query('SELECT id, name FROM watch_collections WHERE id = $1', [FORCE_COLLECTION_ID]);
    if (res.rows.length === 0) throw new Error(`Collection ID not found: ${FORCE_COLLECTION_ID}`);
    console.log(`  ✅ Using collection: ${res.rows[0].name} (${FORCE_COLLECTION_ID})`);
    return FORCE_COLLECTION_ID;
  }

  const slug = slugify(collectionHandle);
  const existing = await pool.query(
    'SELECT id FROM watch_collections WHERE slug = $1 AND brand_id = $2',
    [slug, brandId]
  );
  if (existing.rows.length > 0) {
    console.log(`  ✅ Found existing collection: ${slug} (${existing.rows[0].id})`);
    return existing.rows[0].id;
  }

  const res = await query(
    `INSERT INTO watch_collections (id, brand_id, name, slug, description, is_active, is_featured, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, true, false, NOW(), NOW())
     RETURNING id`,
    [brandId, collectionName, slug, `Briston ${collectionName} collection`]
  );
  const collId = res.rows[0].id;
  console.log(`  ✅ Created collection: ${collectionName} (${collId})`);
  return collId;
}

// ─── WATCH IMPORT ─────────────────────────────────────────────────────────────
async function importWatch(product, brandId, collectionId, imageSourceDir) {
  const slug = slugify(product.handle);
  const sku = product.variants[0]?.sku || null;

  // Check if watch already exists
  const existing = await pool.query(
    'SELECT id FROM watches WHERE slug = $1 OR (sku = $2 AND $2 IS NOT NULL)',
    [slug, sku]
  );

  if (existing.rows.length > 0) {
    if (!UPDATE_EXISTING) {
      return { status: 'skipped', reason: 'already exists', id: existing.rows[0].id };
    }
    // Update existing
    const watchId = existing.rows[0].id;
    await query(
      `UPDATE watches SET
         name = $1, brand_id = $2, collection_id = $3,
         short_description = $4, description = $5,
         base_price = $6, sku = $7,
         in_stock = $8, is_active = true,
         updated_at = NOW()
       WHERE id = $9`,
      [
        product.title,
        brandId, collectionId,
        product.description.substring(0, 300),
        product.description,
        eur2gbp(product.base_price),
        sku,
        product.variants.some(v => v.available),
        watchId
      ]
    );
    return { status: 'updated', id: watchId };
  }

  // ── Insert watch ──────────────────────────────────────────────
  const specs = product.specifications || {};
  const caseDiameter = specs.case_diameter ? parseFloat(specs.case_diameter) : null;

  const res = await query(
    `INSERT INTO watches (
       id, brand_id, collection_id, name, slug, sku,
       short_description, description,
       base_price, currency,
       gender, watch_type, style,
       is_featured, is_active, in_stock,
       stock_quantity, sort_order,
       created_at, updated_at
     ) VALUES (
       gen_random_uuid(), $1, $2, $3, $4, $5,
       $6, $7,
       $8, 'GBP',
       $9, $10, $11,
       false, true, $12,
       $13, 0,
       NOW(), NOW()
     ) RETURNING id`,
    [
      brandId, collectionId,
      product.title, slug, sku,
      product.description.substring(0, 300),
      product.description,
      eur2gbp(product.base_price),
      detectGender(product),
      detectWatchType(product),
      detectStyle(product),
      product.variants.some(v => v.available),
      product.variants.reduce((s, v) => s + (v.available ? 1 : 0), 0)
    ]
  );

  const watchId = res.rows[0].id;

  // ── Insert specifications ─────────────────────────────────────
  if (Object.keys(specs).length > 0) {
    await query(
      `INSERT INTO watch_specifications (
         id, watch_id, movement, case_material, case_diameter,
         water_resistance, created_at, updated_at
       ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())`,
      [
        watchId,
        specs.movement || null,
        specs.case_material || null,
        caseDiameter,
        specs.water_resistance || null
      ]
    );
  }

  // ── Insert variants ───────────────────────────────────────────
  for (const variant of product.variants) {
    if (!variant.sku) continue;
    await query(
      `INSERT INTO watch_variants (
         id, watch_id, variant_name, sku, price_adjustment,
         stock_quantity, is_active, sort_order, created_at, updated_at
       ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, $6, NOW(), NOW())`,
      [
        watchId,
        variant.title || variant.option1 || 'Standard',
        variant.sku,
        0, // price_adjustment = 0, base price already set
        variant.available ? 1 : 0,
        variant.position || 0
      ]
    );
  }

  // ── Insert images ──────────────────────────────────────────────
  if (!SKIP_IMAGES) {
    await importWatchImages(watchId, product, imageSourceDir);
  }

  return { status: 'created', id: watchId };
}

async function importWatchImages(watchId, product, imageSourceDir) {
  const watchImgDir = path.join(UPLOADS_DIR, product.handle);
  fs.mkdirSync(watchImgDir, { recursive: true });

  for (const img of product.images) {
    let imageUrl;
    let localPath = null;

    // Try to copy from local scraped images first
    if (img.local_path && imageSourceDir) {
      const srcPath = path.join(imageSourceDir, img.local_path);
      if (fs.existsSync(srcPath)) {
        const ext = path.extname(srcPath);
        const destFilename = `${product.handle}-${img.position}${ext}`;
        const destPath = path.join(watchImgDir, destFilename);
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
        localPath = `/uploads/watches/${product.handle}/${destFilename}`;
        imageUrl = localPath;
      }
    }

    // Fall back to remote URL
    if (!imageUrl) {
      imageUrl = img.src;
    }

    await query(
      `INSERT INTO watch_images (
         id, watch_id, image_url, alt_text, is_primary, sort_order, created_at, updated_at
       ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())`,
      [
        watchId,
        imageUrl,
        img.alt || product.title,
        img.position === 1,
        img.position
      ]
    );
  }
}

// ─── DETECT FIELDS ────────────────────────────────────────────────────────────
function detectGender(product) {
  const text = (product.title + ' ' + product.tags.join(' ')).toLowerCase();
  if (/women|woman|ladies|lady|femme/.test(text)) return 'women';
  if (/men|man|gent|homme/.test(text)) return 'men';
  return 'unisex';
}

function detectWatchType(product) {
  const text = (product.title + ' ' + product.tags.join(' ') + ' ' + product.description).toLowerCase();
  if (/chrono/.test(text)) return 'chronograph';
  if (/auto/.test(text)) return 'automatic';
  if (/dive|diver|diving/.test(text)) return 'diver';
  if (/dress/.test(text)) return 'dress';
  if (/sport/.test(text)) return 'sport';
  return 'quartz';
}

function detectStyle(product) {
  const text = (product.title + ' ' + product.product_type).toLowerCase();
  if (/sport/.test(text)) return 'sport';
  if (/classic|elegant/.test(text)) return 'classic';
  if (/chic|lady|femme/.test(text)) return 'fashion';
  return 'casual';
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Briston Watch Importer`);
  if (DRY_RUN) console.log(`  ⚠️  DRY RUN MODE — nothing will be written to DB`);
  console.log(`${'═'.repeat(60)}\n`);

  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const imageSourceDir = path.dirname(inputFile);

  console.log(`  File:       ${inputFile}`);
  console.log(`  Collection: ${data.collection}`);
  console.log(`  Products:   ${data.total_products}`);
  console.log(`  Images:     ${data.total_images}\n`);

  // ── Ensure brand & collection ─────────────────────────────────
  console.log('1. Setting up brand & collection...');
  const brandId = await ensureBrand();
  const collectionName = data.collection.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const collectionId = await ensureCollection(brandId, data.collection, collectionName);

  // ── Create uploads dir ────────────────────────────────────────
  if (!DRY_RUN && !SKIP_IMAGES) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // ── Import watches ────────────────────────────────────────────
  console.log('\n2. Importing watches...\n');
  const results = { created: 0, updated: 0, skipped: 0, failed: 0 };
  const failedItems = [];

  for (let i = 0; i < data.products.length; i++) {
    const product = data.products[i];
    const num = `[${String(i + 1).padStart(3)}/${data.products.length}]`;
    process.stdout.write(`  ${num} ${product.title.substring(0, 50).padEnd(50)} `);

    try {
      const result = await importWatch(product, brandId, collectionId, imageSourceDir);
      results[result.status]++;
      console.log(result.status === 'created' ? '✅ created' :
                  result.status === 'updated' ? '🔄 updated' : '⏭️  skipped');
    } catch (err) {
      results.failed++;
      failedItems.push({ handle: product.handle, error: err.message });
      console.log(`❌ FAILED: ${err.message}`);
    }
  }

  // ── Final summary ──────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ✅ IMPORT COMPLETE${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`\n  Created:   ${results.created}`);
  console.log(`  Updated:   ${results.updated}`);
  console.log(`  Skipped:   ${results.skipped} (already in DB)`);
  console.log(`  Failed:    ${results.failed}`);

  if (failedItems.length > 0) {
    console.log('\n  Failed items:');
    failedItems.forEach(f => console.log(`    - ${f.handle}: ${f.error}`));
  }

  console.log(`\n  Brand ID:      ${brandId}`);
  console.log(`  Collection ID: ${collectionId}`);
  console.log();

  await pool.end();
}

main().catch(err => {
  console.error(`\n❌  Fatal: ${err.message}\n`);
  if (process.env.DEBUG) console.error(err.stack);
  pool.end();
  process.exit(1);
});

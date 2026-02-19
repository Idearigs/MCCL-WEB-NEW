#!/usr/bin/env node
/**
 * Briston Watch Scraper
 * ---------------------
 * Uses Briston's Shopify JSON API to scrape watches collection by collection.
 *
 * Usage:
 *   node scraper.js <collection-url-or-handle> [options]
 *
 * Examples:
 *   node scraper.js clubmaster-classic
 *   node scraper.js https://www.briston-watches.com/en/collections/clubmaster-classic
 *   node scraper.js straps-20-mm --no-images
 *
 * Options:
 *   --no-images     Skip downloading images (faster, data only)
 *   --delay <ms>    Delay between requests in ms (default: 800)
 *   --out <dir>     Output directory (default: ./output)
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BASE_URL = 'https://www.briston-watches.com';
const PRODUCTS_PER_PAGE = 250;

const args = process.argv.slice(2);
const inputArg = args.find(a => !a.startsWith('--'));
const skipImages = args.includes('--no-images');
const delayIdx = args.indexOf('--delay');
const REQUEST_DELAY = delayIdx !== -1 ? parseInt(args[delayIdx + 1]) : 800;
const outIdx = args.indexOf('--out');
const OUTPUT_ROOT = path.resolve(outIdx !== -1 ? args[outIdx + 1] : path.join(__dirname, 'output'));

if (!inputArg) {
  console.error('\n❌  Usage: node scraper.js <collection-url-or-handle> [options]\n');
  console.error('   Examples:');
  console.error('     node scraper.js clubmaster-classic');
  console.error('     node scraper.js https://briston-watches.com/en/collections/straps-20-mm');
  console.error('     node scraper.js clubmaster-sport --no-images\n');
  process.exit(1);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractHandle(input) {
  // Accepts full URL or just the handle
  if (input.startsWith('http')) {
    const match = input.match(/\/collections\/([^/?#]+)/);
    if (!match) throw new Error(`Cannot extract collection handle from URL: ${input}`);
    return match[1];
  }
  return input.replace(/^\/+|\/+$/g, '');
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9_\-\.]/gi, '_').replace(/_+/g, '_');
}

function formatPrice(priceStr) {
  const num = parseFloat(priceStr);
  return isNaN(num) ? null : num;
}

function progressBar(current, total, label = '') {
  const width = 30;
  const filled = Math.round((current / total) * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  const pct = Math.round((current / total) * 100);
  process.stdout.write(`\r  [${bar}] ${pct}% (${current}/${total}) ${label.substring(0, 40).padEnd(40)}`);
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────
const axiosClient = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; WatchImporter/1.0)',
    'Accept': 'application/json, text/html, */*'
  }
});

async function fetchJson(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axiosClient.get(url);
      return res.data;
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) throw new Error(`404 Not Found: ${url}`);
      if (attempt === retries) throw err;
      console.log(`\n  ⚠️  Retry ${attempt}/${retries} for ${url} (${err.message})`);
      await sleep(2000 * attempt);
    }
  }
}

async function downloadImage(url, destPath, retries = 3) {
  if (fs.existsSync(destPath)) return 'exists';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axiosClient.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      fs.writeFileSync(destPath, Buffer.from(res.data));
      return 'downloaded';
    } catch (err) {
      if (attempt === retries) {
        console.log(`\n  ❌ Failed to download image: ${url} — ${err.message}`);
        return 'failed';
      }
      await sleep(1500 * attempt);
    }
  }
}

// ─── SCRAPER ──────────────────────────────────────────────────────────────────
async function fetchAllCollectionProducts(handle) {
  const products = [];
  let page = 1;

  while (true) {
    const url = `${BASE_URL}/en/collections/${handle}/products.json?limit=${PRODUCTS_PER_PAGE}&page=${page}`;
    const data = await fetchJson(url);
    const batch = data.products || [];
    products.push(...batch);
    if (batch.length < PRODUCTS_PER_PAGE) break;
    page++;
    await sleep(REQUEST_DELAY);
  }

  return products;
}

async function fetchProductDetail(handle) {
  const url = `${BASE_URL}/en/products/${handle}.json`;
  const data = await fetchJson(url);
  return data.product;
}

function parseProduct(product) {
  // Parse tags into a key-value spec map
  const tags = (product.tags || '').split(',').map(t => t.trim()).filter(Boolean);

  // Parse body_html into clean description
  const description = stripHtml(product.body_html);

  // Parse specifications from description text
  const specs = parseSpecsFromDescription(description, tags);

  // Parse variants
  const variants = (product.variants || []).map(v => ({
    id: v.id,
    title: v.title,
    sku: v.sku,
    price: formatPrice(v.price),
    compare_at_price: formatPrice(v.compare_at_price),
    available: v.available !== false,
    option1: v.option1 || null,
    option2: v.option2 || null,
    option3: v.option3 || null,
    weight: v.grams ? v.grams / 1000 : null,
    barcode: v.barcode || null,
    image_id: v.image_id || null
  }));

  // Get lowest price
  const prices = variants.map(v => v.price).filter(p => p != null);
  const basePrice = prices.length > 0 ? Math.min(...prices) : null;

  // Parse images
  const images = (product.images || []).map((img, idx) => ({
    position: img.position || idx + 1,
    id: img.id,
    alt: img.alt || '',
    width: img.width,
    height: img.height,
    src: img.src,
    // Clean URL (remove query params & size modifiers)
    clean_src: img.src.replace(/\?[^?]*$/, '').replace(/_[0-9]+x[0-9]*\.[a-z]+$/, '').replace(/(_[0-9]+x)/, ''),
    variant_ids: img.variant_ids || []
  }));

  // Options
  const options = (product.options || []).map(o => ({
    name: o.name,
    values: o.values || []
  }));

  return {
    // Identifiers
    id: product.id,
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    product_type: product.product_type,

    // Content
    description_html: product.body_html || '',
    description: description,
    tags,

    // Pricing
    base_price: basePrice,
    currency: 'GBP', // Will need converting from EUR - set during import

    // Specs
    specifications: specs,

    // Options (e.g. "Finish", "Strap")
    options,

    // Variants
    variants,
    variants_count: variants.length,

    // Images (will have local_path filled after download)
    images,
    images_count: images.length,

    // Meta
    created_at: product.created_at,
    updated_at: product.updated_at,
    published_at: product.published_at,

    // Local paths (filled after download)
    local_images: []
  };
}

function parseSpecsFromDescription(desc, tags) {
  const specs = {};

  // Parse from tags
  for (const tag of tags) {
    const lc = tag.toLowerCase();
    if (/^\d+\s*mm$/.test(lc)) specs.case_diameter = tag;
    if (/atm|bar|m\s+water|water\s+resist/.test(lc)) specs.water_resistance = tag;
    if (/quartz|automatic|manual|solar/.test(lc)) specs.movement_type = tag;
    if (/chrono/.test(lc)) specs.features = (specs.features ? specs.features + ', ' : '') + 'Chronograph';
  }

  // Parse from description text using regex patterns
  const patterns = [
    [/(\d+)\s*mm\b/i, 'case_diameter', (m) => `${m[1]} mm`],
    [/(?:miyota|seiko|sw\d+|eta\s*\d+|ronda|[\w\s]+quartz(?:\s+calibr[eu])?)/i, 'movement', (m) => m[0].trim()],
    [/(?:mineral|sapphire|anti[\-\s]?reflect\w*)\s+(?:glass|crystal)/i, 'crystal', (m) => m[0]],
    [/(?:\d+)\s*(?:m|bar|atm)[\s\/-]*(?:water\s*resist\w*)?/i, 'water_resistance', (m) => m[0].trim()],
    [/(?:stainless\s+(?:polished\s+)?steel|pvd|gold[\s\-]?plated|titanium|alumin[iu]+m|acetate)\s+case/i, 'case_material', (m) => m[0]],
  ];

  for (const [regex, key, extract] of patterns) {
    if (!specs[key]) {
      const match = desc.match(regex);
      if (match) specs[key] = extract(match);
    }
  }

  return specs;
}

async function scrapeCollection(collectionHandle) {
  const outputDir = path.join(OUTPUT_ROOT, collectionHandle);
  const imagesDir = path.join(outputDir, 'images');

  fs.mkdirSync(outputDir, { recursive: true });
  if (!skipImages) fs.mkdirSync(imagesDir, { recursive: true });

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Briston Watch Scraper`);
  console.log(`  Collection: ${collectionHandle}`);
  console.log(`  Output:     ${outputDir}`);
  if (skipImages) console.log(`  Images:     SKIPPED`);
  console.log(`${'═'.repeat(60)}`);

  // ── Step 1: Fetch product list ──────────────────────────────
  console.log('\n📋  Fetching product list...');
  const rawProducts = await fetchAllCollectionProducts(collectionHandle);

  if (rawProducts.length === 0) {
    console.error(`\n❌  No products found for collection: ${collectionHandle}`);
    console.error(`    Make sure the handle is correct (e.g. "clubmaster-classic", not full URL)\n`);
    process.exit(1);
  }

  console.log(`    Found ${rawProducts.length} products\n`);

  // ── Step 2: Fetch full product details ──────────────────────
  console.log('🔍  Fetching full product details...');
  const products = [];
  let downloaded = 0, skipped = 0, failed = 0;

  for (let i = 0; i < rawProducts.length; i++) {
    const raw = rawProducts[i];
    progressBar(i + 1, rawProducts.length, raw.handle);

    try {
      // The collection endpoint already has full data, but fetch individual
      // page to ensure we get ALL images and complete body_html
      let fullProduct;
      try {
        fullProduct = await fetchProductDetail(raw.handle);
        await sleep(REQUEST_DELAY);
      } catch (e) {
        // Fallback to collection data
        fullProduct = raw;
      }

      const parsed = parseProduct(fullProduct);
      products.push(parsed);

      // Save individual product JSON
      const productFile = path.join(outputDir, 'products', `${raw.handle}.json`);
      fs.mkdirSync(path.dirname(productFile), { recursive: true });
      fs.writeFileSync(productFile, JSON.stringify(parsed, null, 2));

    } catch (err) {
      console.log(`\n  ⚠️  Error processing ${raw.handle}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n\n✅  Products fetched: ${products.length} OK, ${failed} failed\n`);

  // ── Step 3: Download images ──────────────────────────────────
  if (!skipImages) {
    console.log('🖼️   Downloading images...');
    let totalImages = products.reduce((sum, p) => sum + p.images_count, 0);
    let imgCount = 0;

    for (const product of products) {
      const productImgDir = path.join(imagesDir, product.handle);
      fs.mkdirSync(productImgDir, { recursive: true });

      for (const img of product.images) {
        imgCount++;
        const ext = path.extname(img.src.split('?')[0]) || '.jpg';
        const filename = `${img.position}${ext}`;
        const destPath = path.join(productImgDir, filename);

        progressBar(imgCount, totalImages, `${product.handle}/${filename}`);

        const result = await downloadImage(img.src, destPath);
        img.local_path = `images/${product.handle}/${filename}`;
        img.local_status = result;

        if (result === 'downloaded') downloaded++;
        else if (result === 'exists') skipped++;
        else failed++;

        await sleep(200); // gentler rate limiting for images
      }

      product.local_images = product.images.map(img => img.local_path).filter(Boolean);
    }

    console.log(`\n\n✅  Images: ${downloaded} downloaded, ${skipped} already existed, ${failed} failed\n`);
  }

  // ── Step 4: Save combined output ────────────────────────────
  const summary = {
    collection: collectionHandle,
    scraped_at: new Date().toISOString(),
    total_products: products.length,
    total_images: products.reduce((s, p) => s + p.images_count, 0),
    base_url: BASE_URL,
    products
  };

  const allProductsFile = path.join(outputDir, 'all-products.json');
  fs.writeFileSync(allProductsFile, JSON.stringify(summary, null, 2));

  // Also save a slim import-ready version (without images array, just paths)
  const importReady = {
    ...summary,
    products: products.map(p => ({
      handle: p.handle,
      title: p.title,
      vendor: p.vendor,
      product_type: p.product_type,
      description: p.description,
      tags: p.tags,
      base_price: p.base_price,
      specifications: p.specifications,
      options: p.options,
      variants: p.variants,
      images: skipImages
        ? p.images.map(img => ({ src: img.src, alt: img.alt, position: img.position }))
        : p.images.map(img => ({
            local_path: img.local_path || null,
            src: img.src,
            alt: img.alt,
            position: img.position,
            variant_ids: img.variant_ids
          }))
    }))
  };

  const importFile = path.join(outputDir, 'import-ready.json');
  fs.writeFileSync(importFile, JSON.stringify(importReady, null, 2));

  // ── Final summary ────────────────────────────────────────────
  console.log(`${'═'.repeat(60)}`);
  console.log(`  ✅ DONE!`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`\n  Collection:   ${collectionHandle}`);
  console.log(`  Products:     ${products.length}`);
  console.log(`  Images:       ${products.reduce((s, p) => s + p.images_count, 0)}${skipImages ? ' (not downloaded)' : ' downloaded'}`);
  console.log(`\n  Output files:`);
  console.log(`    📄 all-products.json    — Full scraped data`);
  console.log(`    📄 import-ready.json    — Ready for database import`);
  console.log(`    📁 products/            — One JSON per watch`);
  if (!skipImages) console.log(`    📁 images/              — All product images`);
  console.log(`\n  Output directory:`);
  console.log(`    ${outputDir}\n`);

  return summary;
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────
(async () => {
  try {
    const handle = extractHandle(inputArg);
    await scrapeCollection(handle);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌  Fatal error: ${err.message}\n`);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
})();

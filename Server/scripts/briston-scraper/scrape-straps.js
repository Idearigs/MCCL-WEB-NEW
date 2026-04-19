#!/usr/bin/env node
/**
 * Briston Straps Scraper
 * ----------------------
 * Fetches HTML from straps collection pages (JSON API is blocked),
 * deduplicates, then fetches each product JSON for images.
 */

const axios   = require('axios');
const cheerio = require('cheerio');
const fs      = require('fs');
const path    = require('path');

const BASE_URL   = 'https://www.briston-watches.com';
const OUTPUT_DIR = path.join(__dirname, 'output', 'straps');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');

fs.mkdirSync(IMAGES_DIR, { recursive: true });

const client = axios.create({
  timeout: 20000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

function progressBar(cur, total, label = '') {
  const w = 30, filled = Math.round((cur / total) * w);
  const bar = '█'.repeat(filled) + '░'.repeat(w - filled);
  process.stdout.write(`\r  [${bar}] ${Math.round((cur/total)*100)}% (${cur}/${total}) ${label.substring(0,35).padEnd(35)}`);
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseStrapType(name) {
  const n = name.toUpperCase();
  if (/RUBBER|SILICONE/.test(n))         return 'rubber';
  if (/VELCRO/.test(n))                   return 'velcro';
  if (/PARACHUTE/.test(n))               return 'parachute';
  if (/NATO/.test(n))                    return 'nato';
  if (/MILANESE|MESH/.test(n))           return 'milanese';
  if (/STEEL|BRACELET.*ACIER/.test(n))   return 'steel';
  if (/SUEDE/.test(n))                   return 'suede';
  if (/LEATHER|CUIR|LUXURY/.test(n))     return 'leather';
  return 'other';
}

function extractColor(name) {
  // Extract color after last dash or "–"
  const m = name.match(/[-–]\s*([A-Z].+)$/i);
  return m ? m[1].trim() : null;
}

async function fetchCollectionStraps(collectionHandle, widthMm) {
  const url = `${BASE_URL}/en/collections/${collectionHandle}`;
  console.log(`\n  Fetching ${collectionHandle}...`);
  const res = await client.get(url, { headers: { Accept: 'text/html' } });
  const $ = cheerio.load(res.data);

  const seen = new Set();
  const straps = [];

  $('.product-item, .card, [class*="product-card"], .grid-item, .card-wrapper').each((_, el) => {
    const title = $(el).find('[class*="title"], h3, h2, .card__heading').first().text().trim();
    const priceText = $(el).find('[class*="price"]:not([class*="compare"]), .price__regular').first().text().trim();
    const link = $(el).find('a[href*="/products/"]').first().attr('href');

    if (!title || !link) return;

    // Extract handle from URL
    const handleMatch = link.match(/\/products\/([^?#]+)/);
    if (!handleMatch) return;
    const handle = decodeURIComponent(handleMatch[1]);

    if (seen.has(handle)) return;
    seen.add(handle);

    // Parse price
    const priceMatch = priceText.match(/[\d,]+(?:\.\d+)?/);
    const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : null;

    straps.push({
      handle,
      name: title,
      slug: slugify(title),
      strap_type: parseStrapType(title),
      color: extractColor(title),
      width_mm: widthMm,
      price_eur: price,
      price_gbp: price ? Math.round(price * 0.86 * 100) / 100 : null,
      image_url: null,
      local_image: null
    });
  });

  console.log(`    Found ${straps.length} unique straps`);
  return straps;
}

async function enrichWithProductJson(strap) {
  try {
    const res = await client.get(`${BASE_URL}/en/products/${strap.handle}.json`);
    const p = res.data.product;
    if (p?.images?.[0]?.src) {
      strap.image_src = p.images[0].src;
      strap.title_confirmed = p.title;
    }
  } catch {
    // JSON API blocked — strap image will be null
  }
  return strap;
}

async function downloadImage(url, handle) {
  if (!url) return null;
  try {
    const ext = path.extname(url.split('?')[0]) || '.jpg';
    const filename = `${handle}${ext}`;
    const dest = path.join(IMAGES_DIR, filename);
    if (fs.existsSync(dest)) return `images/${filename}`;

    const res = await client.get(url, { responseType: 'arraybuffer', timeout: 20000 });
    fs.writeFileSync(dest, Buffer.from(res.data));
    return `images/${filename}`;
  } catch {
    return null;
  }
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  Briston Straps Scraper');
  console.log('═'.repeat(60));

  // Fetch from multiple collection pages
  const collections = [
    { handle: 'straps',     width: 20 },   // Main strap collection (20mm - for Classic/Sport)
    { handle: 'straps-18mm', width: 18 },  // 18mm straps - for Chic
  ];

  let allStraps = [];
  const globalSeen = new Set();

  for (const col of collections) {
    const straps = await fetchCollectionStraps(col.handle, col.width);
    for (const s of straps) {
      if (!globalSeen.has(s.handle)) {
        globalSeen.add(s.handle);
        allStraps.push(s);
      }
    }
    await sleep(1000);
  }

  console.log(`\n  Total unique straps: ${allStraps.length}`);

  // Enrich with product JSON (images)
  console.log('\n🔍  Fetching product images...');
  for (let i = 0; i < allStraps.length; i++) {
    progressBar(i + 1, allStraps.length, allStraps[i].handle);
    await enrichWithProductJson(allStraps[i]);
    await sleep(400);
  }
  console.log('\n');

  // Download images
  console.log('🖼️   Downloading images...');
  let downloaded = 0, failed = 0;
  for (let i = 0; i < allStraps.length; i++) {
    const s = allStraps[i];
    progressBar(i + 1, allStraps.length, s.handle);
    if (s.image_src) {
      s.local_image = await downloadImage(s.image_src, s.handle);
      if (s.local_image) downloaded++; else failed++;
    } else {
      failed++;
    }
    await sleep(200);
  }
  console.log(`\n  Downloaded: ${downloaded} | No image: ${failed}\n`);

  // Show breakdown by type
  const byType = {};
  allStraps.forEach(s => { byType[s.strap_type] = (byType[s.strap_type] || 0) + 1; });
  console.log('  Breakdown by type:');
  Object.entries(byType).sort((a,b) => b[1]-a[1]).forEach(([t, c]) => console.log(`    ${t.padEnd(12)} ${c}`));

  // Save output
  fs.writeFileSync(path.join(OUTPUT_DIR, 'straps.json'), JSON.stringify({ scraped_at: new Date().toISOString(), total: allStraps.length, straps: allStraps }, null, 2));
  console.log(`\n  ✅ Saved to ${OUTPUT_DIR}/straps.json`);

  console.log('\n' + '═'.repeat(60));
  console.log('  ✅ DONE — ' + allStraps.length + ' straps');
  console.log('═'.repeat(60) + '\n');
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });

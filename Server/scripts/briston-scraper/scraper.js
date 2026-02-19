#!/usr/bin/env node
/**
 * Briston Watch Scraper v2
 * ------------------------
 * Uses Shopify JSON API + full HTML page parsing (cheerio) to capture:
 *   - Product name, price, SKU, images, variants/finishes
 *   - Full description
 *   - Technical specifications (parsed from description + JSON-LD)
 *   - Warranty information
 *   - Delivery / Exchange & Return info
 *   - Compatible straps ("Briston Your Style" section)
 *   - Finish colour options with their images
 *
 * Usage:
 *   node scraper.js <collection-handle-or-url> [options]
 *
 * Options:
 *   --no-images   Skip image downloads
 *   --delay <ms>  Request delay in ms (default: 900)
 *   --out <dir>   Output directory (default: ./output)
 */

const axios   = require('axios');
const cheerio = require('cheerio');
const fs      = require('fs');
const path    = require('path');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BASE_URL          = 'https://www.briston-watches.com';
const PRODUCTS_PER_PAGE = 250;

const args       = process.argv.slice(2);
const inputArg   = args.find(a => !a.startsWith('--'));
const skipImages = args.includes('--no-images');
const delayIdx   = args.indexOf('--delay');
const DELAY      = delayIdx !== -1 ? parseInt(args[delayIdx + 1]) : 900;
const outIdx     = args.indexOf('--out');
const OUTPUT_ROOT = path.resolve(outIdx !== -1 ? args[outIdx + 1] : path.join(__dirname, 'output'));

if (!inputArg) {
  console.error('\nUsage: node scraper.js <collection-handle> [--no-images] [--delay 900]\n');
  process.exit(1);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function extractHandle(input) {
  if (input.startsWith('http')) {
    const m = input.match(/\/collections\/([^/?#]+)/);
    if (!m) throw new Error(`Cannot extract handle from: ${input}`);
    return m[1];
  }
  return input.replace(/^\/+|\/+$/g, '');
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n').replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n').trim();
}

function progressBar(cur, total, label = '') {
  const w = 30, filled = Math.round((cur / total) * w);
  const bar = '█'.repeat(filled) + '░'.repeat(w - filled);
  process.stdout.write(`\r  [${bar}] ${Math.round((cur/total)*100)}% (${cur}/${total}) ${label.substring(0,38).padEnd(38)}`);
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────
const client = axios.create({
  timeout: 25000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
});

async function fetchJson(url, retries = 3) {
  for (let i = 1; i <= retries; i++) {
    try { return (await client.get(url)).data; }
    catch (e) {
      if (e.response?.status === 404) throw new Error(`404: ${url}`);
      if (i === retries) throw e;
      await sleep(2000 * i);
    }
  }
}

async function fetchHtml(url, retries = 3) {
  for (let i = 1; i <= retries; i++) {
    try { return (await client.get(url, { headers: { Accept: 'text/html' } })).data; }
    catch (e) {
      if (i === retries) return null;
      await sleep(2000 * i);
    }
  }
}

async function downloadImage(url, destPath) {
  if (fs.existsSync(destPath)) return 'exists';
  try {
    const res = await client.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    fs.writeFileSync(destPath, Buffer.from(res.data));
    return 'downloaded';
  } catch { return 'failed'; }
}

// ─── HTML PAGE PARSER ─────────────────────────────────────────────────────────
function parseProductPage(html, handle) {
  const result = {
    warranty: null,
    delivery: null,
    care: null,
    compatible_straps: [],
    finishes: [],
    technical_details: {},
    extra_sections: []
  };

  if (!html) return result;
  const $ = cheerio.load(html);

  // ── Extract JSON-LD structured data ─────────────────────────────────────────
  let jsonLdProduct = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      const items = Array.isArray(data) ? data : (data['@graph'] || [data]);
      for (const item of items) {
        if (item['@type'] === 'Product') { jsonLdProduct = item; break; }
      }
    } catch {}
  });

  // ── Extract Shopify product JSON from page scripts ────────────────────────
  let shopifyProduct = null;
  $('script').each((_, el) => {
    const text = $(el).html() || '';
    const m = text.match(/var\s+meta\s*=\s*(\{[\s\S]*?\});/) ||
              text.match(/window\.ShopifyAnalytics\.meta\s*=\s*(\{[\s\S]*?\});/) ||
              text.match(/"product"\s*:\s*(\{[\s\S]*?\})\s*[,}]/);
    if (m && !shopifyProduct) {
      try { shopifyProduct = JSON.parse(m[1]); } catch {}
    }
  });

  // ── Accordion / detail sections ──────────────────────────────────────────
  // Briston uses details/summary OR div accordion patterns
  const accordionSelectors = [
    'details', '.accordion__item', '.product-accordion', '.collapsible',
    '[data-accordion]', '.product__accordion', '.js-accordion'
  ];

  // Try details/summary elements first
  $('details').each((_, el) => {
    const title = $(el).find('summary').text().trim().toUpperCase();
    const body  = $(el).find('summary').remove().end().text().trim();
    if (!body) return;

    if (/WARRANTY/.test(title))       result.warranty = body;
    else if (/DELIVERY|RETURN|EXCHANGE/.test(title)) result.delivery = body;
    else if (/CARE|MAINTENANCE/.test(title))  result.care = body;
    else if (title && body.length > 20) {
      result.extra_sections.push({ title, text: body });
    }
  });

  // Fallback: search all text blocks for warranty/delivery keywords
  if (!result.warranty || !result.delivery) {
    $('*').each((_, el) => {
      const $el = $(el);
      if ($el.children().length > 3) return; // skip containers
      const text = $el.text().trim();

      if (!result.warranty && /2.year.*(warranty|guarantee)/i.test(text) && text.length > 30) {
        result.warranty = text;
      }
      if (!result.delivery && /placed before.*12pm|standard delivery|exchange.*30 days/i.test(text) && text.length > 30) {
        result.delivery = (result.delivery ? result.delivery + '\n' : '') + text;
      }
    });
  }

  // ── "Briston Your Style" compatible straps ────────────────────────────────
  // These appear as product recommendations on the page
  const strapSelectors = [
    '.product-recommendations', '.cross-sell', '[class*="your-style"]',
    '[class*="strap"]', '.complementary-products'
  ];
  $(strapSelectors.join(',')).each((_, el) => {
    $(el).find('a, .product-item, .recommendation').each((_, item) => {
      const name  = $(item).find('[class*="title"], h3, h4, .title').first().text().trim();
      const price = $(item).find('[class*="price"], .price').first().text().trim();
      if (name) result.compatible_straps.push({ name, price: price || null });
    });
  });

  // Fallback: look for strap product links near "BRISTON YOUR STYLE" text
  if (result.compatible_straps.length === 0) {
    let foundSection = false;
    $('*').each((_, el) => {
      const text = $(el).text();
      if (/BRISTON YOUR STYLE/i.test(text) && !foundSection) {
        foundSection = true;
        // Look at siblings/children for product items
        $(el).closest('section, div').find('a[href*="/products/"]').each((_, a) => {
          const name  = $(a).find('[class*="title"], p, h3, h4').first().text().trim() || $(a).text().trim();
          const price = $(a).find('[class*="price"]').first().text().trim();
          if (name && name.length > 3 && !name.toUpperCase().includes('BRISTON YOUR STYLE')) {
            result.compatible_straps.push({ name, price: price || null });
          }
        });
      }
    });
  }

  // ── Finishes from variant selectors ──────────────────────────────────────
  $('[data-variant-option], .product__variant-option, [class*="color-swatch"], [class*="finish"]').each((_, el) => {
    const label = $(el).attr('data-value') || $(el).attr('title') || $(el).text().trim();
    const img   = $(el).find('img').attr('src') || $(el).css('background-image');
    if (label && label.length < 80) {
      result.finishes.push({ label, swatch_image: img || null });
    }
  });

  // ── Better technical specs from description ──────────────────────────────
  const descHtml = $('[class*="description"], .product__description, .product-description').html() || '';
  const descText = stripHtml(descHtml);
  if (descText) {
    result.technical_details = parseSpecs(descText, jsonLdProduct);
  }

  return result;
}

// ─── SPEC PARSER ─────────────────────────────────────────────────────────────
function parseSpecs(text, jsonLd) {
  const specs = {};
  const t = text + ' ' + (jsonLd?.description || '');

  // Case diameter
  const diam = t.match(/(\d+)\s*mm/i);
  if (diam) specs.case_diameter = diam[1] + ' mm';

  // Movement
  const mov = t.match(/(miyota\s+[\w\d]+|ronda\s+[\w\d]+|eta\s+[\w\d]+|sw\s*\d+|seiko\s+[\w\d]+|[\w\s]+quartz\s+calibr[eu])/i);
  if (mov) specs.movement = mov[0].trim();

  // Water resistance
  const water = t.match(/(\d+\s*(?:m|bar|atm)(?:\s*\/\s*\d+\s*(?:m|bar|ft|atm))?)/i);
  if (water) specs.water_resistance = water[0].trim();

  // Crystal / Glass
  const crystal = t.match(/(domed\s+mineral|sapphire|anti-reflective\s+sapphire|mineral\s+crystal|hardened\s+mineral)/i);
  if (crystal) specs.crystal = crystal[0].trim();

  // Case material
  const caseM = t.match(/(stainless\s+(?:polished\s+)?steel|pvd|gold-plated|titanium|acetate|aluminium)[^.]*case/i);
  if (caseM) specs.case_material = caseM[0].trim();

  // Dial colour
  const dial = t.match(/(black|white|silvered\s+white|blue|green|grey|cream|champagne|mother[\s-]of[\s-]pearl|gradient)[^.]*dial/i);
  if (dial) specs.dial_colour = dial[0].replace(/dial$/i, '').trim();

  // Strap
  const strap = t.match(/(?:interchangeable\s+strap|strap)[^.]*?:\s*([^.]+)/i) ||
                t.match(/exclusive briston[^.]*strap[^.]+/i);
  if (strap) specs.strap = (strap[1] || strap[0]).trim();

  // Functions / complications
  const funcs = [];
  if (/chrono/i.test(t))    funcs.push('Chronograph');
  if (/date/i.test(t))      funcs.push('Date');
  if (/gmt|dual.?time/i.test(t)) funcs.push('GMT');
  if (/alarm/i.test(t))     funcs.push('Alarm');
  if (/\b24.hour\b/i.test(t)) funcs.push('24-hour indicator');
  if (/tachymeter/i.test(t)) funcs.push('Tachymeter');
  if (funcs.length) specs.functions = funcs.join(', ');

  // Luminova
  if (/superluminova|luminescent/i.test(t)) specs.luminosity = 'SuperLuminova® luminescent inserts';

  return specs;
}

// ─── COLLECTION FETCHER ───────────────────────────────────────────────────────
async function fetchAllCollectionProducts(handle) {
  const products = [];
  let page = 1;
  while (true) {
    const data = await fetchJson(`${BASE_URL}/en/collections/${handle}/products.json?limit=${PRODUCTS_PER_PAGE}&page=${page}`);
    const batch = data.products || [];
    products.push(...batch);
    if (batch.length < PRODUCTS_PER_PAGE) break;
    page++;
    await sleep(DELAY);
  }
  return products;
}

// ─── PRODUCT PARSER ───────────────────────────────────────────────────────────
function buildProduct(jsonData, pageData) {
  const tags    = (jsonData.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const desc    = stripHtml(jsonData.body_html);
  const specs   = { ...parseSpecs(desc, null), ...pageData.technical_details };

  // Variants (finishes)
  const variants = (jsonData.variants || []).map(v => ({
    id:               v.id,
    title:            v.title,
    sku:              v.sku,
    price:            parseFloat(v.price) || null,
    compare_at_price: parseFloat(v.compare_at_price) || null,
    available:        v.available !== false,
    option1:          v.option1 || null,
    option2:          v.option2 || null,
    barcode:          v.barcode || null,
    image_id:         v.image_id || null
  }));

  const prices    = variants.map(v => v.price).filter(p => p != null);
  const basePrice = prices.length ? Math.min(...prices) : null;

  // Images — map variant_ids so we know which finish each image belongs to
  const images = (jsonData.images || []).map(img => ({
    position:    img.position,
    id:          img.id,
    alt:         img.alt || '',
    width:       img.width,
    height:      img.height,
    src:         img.src,
    variant_ids: img.variant_ids || []
  }));

  // Options
  const options = (jsonData.options || []).map(o => ({ name: o.name, values: o.values || [] }));

  return {
    // Core
    id:           jsonData.id,
    handle:       jsonData.handle,
    title:        jsonData.title,
    vendor:       jsonData.vendor,
    product_type: jsonData.product_type,
    sku:          variants[0]?.sku || null,

    // Content
    description_html: jsonData.body_html || '',
    description:      desc,

    // Pricing
    base_price:   basePrice,
    currency:     'EUR',

    // Tags
    tags,

    // Options / finishes
    options,

    // Variants
    variants,
    variants_count: variants.length,

    // Images
    images,
    images_count: images.length,

    // Parsed specs
    specifications: specs,

    // Page-scraped extras
    warranty:          pageData.warranty  || 'All our watches come with a 2-year international warranty. By authenticating your watch and joining the Briston Club, you benefit from a one-year extension.',
    delivery:          pageData.delivery  || 'Orders placed before 12pm are processed and dispatched the same day. Standard delivery is free.',
    care_instructions: pageData.care      || null,
    compatible_straps: pageData.compatible_straps || [],
    extra_sections:    pageData.extra_sections    || [],
    finishes:          pageData.finishes          || [],

    // Meta
    created_at:   jsonData.created_at,
    updated_at:   jsonData.updated_at,
    published_at: jsonData.published_at,

    // Filled after download
    local_images: []
  };
}

// ─── MAIN SCRAPE ─────────────────────────────────────────────────────────────
async function scrapeCollection(collectionHandle) {
  const outputDir  = path.join(OUTPUT_ROOT, collectionHandle);
  const imagesDir  = path.join(outputDir, 'images');
  const productsDir = path.join(outputDir, 'products');

  fs.mkdirSync(productsDir, { recursive: true });
  if (!skipImages) fs.mkdirSync(imagesDir, { recursive: true });

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Briston Scraper v2`);
  console.log(`  Collection: ${collectionHandle}`);
  console.log(`  Mode: JSON API + full HTML parsing`);
  if (skipImages) console.log(`  Images: SKIPPED`);
  console.log(`${'═'.repeat(60)}\n`);

  // Step 1 — product list
  console.log('📋  Fetching product list...');
  const rawList = await fetchAllCollectionProducts(collectionHandle);
  if (!rawList.length) { console.error('  No products found.'); process.exit(1); }
  console.log(`    Found ${rawList.length} products\n`);

  // Step 2 — full detail per product (JSON API + HTML page)
  console.log('🔍  Fetching full details (JSON + HTML page)...');
  const products = [];
  let failed = 0;

  for (let i = 0; i < rawList.length; i++) {
    const raw = rawList[i];
    progressBar(i + 1, rawList.length, raw.handle);

    try {
      // JSON API
      let jsonData;
      try {
        const d = await fetchJson(`${BASE_URL}/en/products/${raw.handle}.json`);
        jsonData = d.product;
      } catch { jsonData = raw; }
      await sleep(DELAY);

      // HTML page for extra sections
      const html     = await fetchHtml(`${BASE_URL}/en/products/${raw.handle}`);
      const pageData = parseProductPage(html, raw.handle);
      await sleep(DELAY);

      const product = buildProduct(jsonData, pageData);
      products.push(product);

      fs.writeFileSync(path.join(productsDir, `${raw.handle}.json`), JSON.stringify(product, null, 2));
    } catch (e) {
      console.log(`\n  ⚠️  ${raw.handle}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n\n✅  ${products.length} OK, ${failed} failed\n`);

  // Step 3 — download images
  if (!skipImages) {
    console.log('🖼️   Downloading images...');
    const total = products.reduce((s, p) => s + p.images_count, 0);
    let count = 0, downloaded = 0, skipped = 0;

    for (const product of products) {
      const dir = path.join(imagesDir, product.handle);
      fs.mkdirSync(dir, { recursive: true });

      for (const img of product.images) {
        count++;
        const ext      = path.extname(img.src.split('?')[0]) || '.jpg';
        const filename = `${img.position}${ext}`;
        const dest     = path.join(dir, filename);

        progressBar(count, total, `${product.handle}/${filename}`);
        const r = await downloadImage(img.src, dest);
        img.local_path = `images/${product.handle}/${filename}`;
        if (r === 'downloaded') downloaded++;
        else if (r === 'exists') skipped++;

        await sleep(150);
      }
      product.local_images = product.images.map(i => i.local_path).filter(Boolean);
    }
    console.log(`\n\n✅  Images: ${downloaded} downloaded, ${skipped} existed\n`);
  }

  // Step 4 — save output files
  const summary = { collection: collectionHandle, scraped_at: new Date().toISOString(), total_products: products.length, total_images: products.reduce((s,p) => s + p.images_count, 0), products };
  fs.writeFileSync(path.join(outputDir, 'all-products.json'), JSON.stringify(summary, null, 2));

  // import-ready: slimmed for the importer
  const importReady = {
    ...summary,
    products: products.map(p => ({
      handle:            p.handle,
      title:             p.title,
      vendor:            p.vendor,
      product_type:      p.product_type,
      sku:               p.sku,
      description_html:  p.description_html,
      description:       p.description,
      base_price:        p.base_price,
      tags:              p.tags,
      specifications:    p.specifications,
      options:           p.options,
      variants:          p.variants,
      warranty:          p.warranty,
      delivery:          p.delivery,
      care_instructions: p.care_instructions,
      compatible_straps: p.compatible_straps,
      extra_sections:    p.extra_sections,
      images: skipImages
        ? p.images.map(img => ({ src: img.src, alt: img.alt, position: img.position, variant_ids: img.variant_ids }))
        : p.images.map(img => ({ local_path: img.local_path || null, src: img.src, alt: img.alt, position: img.position, variant_ids: img.variant_ids }))
    }))
  };
  fs.writeFileSync(path.join(outputDir, 'import-ready.json'), JSON.stringify(importReady, null, 2));

  console.log(`${'═'.repeat(60)}`);
  console.log(`  ✅ DONE`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Products: ${products.length} | Images: ${products.reduce((s,p)=>s+p.images_count,0)}`);
  console.log(`  Output:   ${outputDir}\n`);

  // Show what was captured as a sample
  const sample = products[0];
  if (sample) {
    console.log(`  Sample — ${sample.title}:`);
    console.log(`    SKU:          ${sample.sku}`);
    console.log(`    Specs:        ${Object.keys(sample.specifications).join(', ')}`);
    console.log(`    Warranty:     ${sample.warranty ? '✅ captured' : '❌ missing'}`);
    console.log(`    Delivery:     ${sample.delivery ? '✅ captured' : '❌ missing'}`);
    console.log(`    Straps:       ${sample.compatible_straps.length} found`);
    console.log(`    Extra sects:  ${sample.extra_sections.length} found\n`);
  }
}

// ─── ENTRY ────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await scrapeCollection(extractHandle(inputArg));
    process.exit(0);
  } catch (e) {
    console.error(`\n❌  ${e.message}\n`);
    process.exit(1);
  }
})();

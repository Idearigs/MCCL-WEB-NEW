const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Intercept JSON API calls
  const jsonResponses = [];
  page.on('response', async res => {
    const url = res.url();
    const ct = res.headers()['content-type'] || '';
    if (ct.includes('json') && (url.includes('festina') || url.includes('fcloud'))) {
      try {
        const json = await res.json();
        jsonResponses.push({ url, data: json });
      } catch {}
    }
  });

  // 1. Get all collections from the man page
  console.log('\n=== LOADING MAN COLLECTIONS ===');
  await page.goto('https://festina.com/en-GB/watch/man', { waitUntil: 'networkidle', timeout: 30000 });

  // Find all collection links
  const menCollections = await page.$$eval('a[href*="/collection/"]', els =>
    [...new Set(els.map(el => el.href))].filter(h => h.includes('/man') || !h.includes('/woman'))
  );
  console.log('Men collections:', menCollections);

  // 2. Get all women collections
  console.log('\n=== LOADING WOMAN COLLECTIONS ===');
  await page.goto('https://festina.com/en-GB/watch/woman', { waitUntil: 'networkidle', timeout: 30000 });

  const womenCollections = await page.$$eval('a[href*="/collection/"]', els =>
    [...new Set(els.map(el => el.href))].filter(h => h.includes('/woman') || !h.includes('/man'))
  );
  console.log('Women collections:', womenCollections);

  // 3. Load a single collection page and extract product data
  console.log('\n=== LOADING CHRONO BIKE COLLECTION (MAN) ===');
  await page.goto('https://festina.com/en-GB/collection/chrono-bike/man', { waitUntil: 'networkidle', timeout: 30000 });

  const products = await page.$$eval('[class*="product"], article[class*="watch"], [data-ref], .watch-card', els =>
    els.slice(0, 5).map(el => ({
      html: el.outerHTML.substring(0, 300),
      text: el.innerText.trim().substring(0, 150),
      links: Array.from(el.querySelectorAll('a')).map(a => a.href).slice(0, 3)
    }))
  );
  console.log('\nProduct cards (first 3):');
  products.slice(0, 3).forEach((p, i) => {
    console.log(`\n--- Product ${i+1} ---`);
    console.log('Text:', p.text);
    console.log('Links:', p.links);
    console.log('HTML:', p.html);
  });

  // Get product links
  const productLinks = await page.$$eval('a[href*="/watch/"], a[href*="/product/"]', els =>
    [...new Set(els.map(el => el.href))].slice(0, 10)
  );
  console.log('\nProduct links:', productLinks);

  // 4. Check JSON API responses captured
  console.log('\n=== JSON API RESPONSES ===');
  jsonResponses.forEach(r => {
    if (!r.url.includes('i18n') && !r.url.includes('cookiebot') && !r.url.includes('oct8ne')) {
      console.log('\nURL:', r.url);
      console.log('Data:', JSON.stringify(r.data).substring(0, 300));
    }
  });

  await browser.close();
})().catch(e => { console.error('Error:', e.message); process.exit(1); });

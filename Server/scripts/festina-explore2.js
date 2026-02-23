const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture ALL network requests to find the data API
  const apiCalls = [];
  page.on('request', req => {
    const url = req.url();
    // Exclude images and static assets
    if (!url.match(/\.(webp|jpg|png|css|woff|svg|ico)/) && !url.includes('google') && !url.includes('analytics')) {
      apiCalls.push({ url, method: req.method(), post: req.postData()?.substring(0, 100) });
    }
  });
  page.on('response', async res => {
    const url = res.url();
    const ct = res.headers()['content-type'] || '';
    if (ct.includes('json') && !url.includes('google')) {
      try {
        const json = await res.json();
        console.log('\n=== JSON RESPONSE from:', url.substring(0, 120));
        const str = JSON.stringify(json);
        console.log(str.substring(0, 400));
      } catch {}
    }
  });

  console.log('Loading /en-GB/watch/man ...');
  await page.goto('https://festina.com/en-GB/watch/man', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Title:', await page.title());

  // Get collection filters / facets
  const filters = await page.$$eval('[class*="filter"], [class*="facet"], [class*="collection"], [class*="category"]', els =>
    els.slice(0, 30).map(el => el.innerText.trim().substring(0, 80)).filter(Boolean)
  );
  console.log('\nFilters/Categories found:', filters.slice(0, 20));

  // Get select/dropdown options
  const selects = await page.$$eval('select option', els =>
    els.map(el => ({ value: el.value, text: el.innerText.trim() })).filter(o => o.text)
  );
  console.log('\nSelect options:', selects.slice(0, 20));

  // Product card info
  const products = await page.$$eval('[class*="product"], article, [data-product-id], [data-ref]', els =>
    els.slice(0, 5).map(el => ({
      text: el.innerText.trim().substring(0, 100),
      dataset: JSON.stringify(el.dataset).substring(0, 100),
      href: el.querySelector('a')?.href || ''
    }))
  );
  console.log('\nProduct cards sample:');
  products.forEach(p => console.log('  text:', p.text, '\n  data:', p.dataset, '\n  href:', p.href));

  console.log('\n=== ALL NON-ASSET REQUESTS ===');
  apiCalls.forEach(c => console.log(' ', c.method, c.url));

  await browser.close();
})().catch(e => { console.error('Error:', e.message); process.exit(1); });

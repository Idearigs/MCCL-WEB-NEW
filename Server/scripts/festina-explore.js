const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-GB,en;q=0.9' });

  console.log('Loading Festina watches page...');
  await page.goto('https://festina.com/en-GB/watch', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('Title:', await page.title());
  console.log('URL:', page.url());

  // Get all links containing /watch
  const navLinks = await page.$$eval('a', els =>
    els.filter(el => el.href && el.href.includes('/watch'))
       .slice(0, 40)
       .map(el => ({ href: el.href, text: el.innerText.trim().substring(0, 60) }))
       .filter(l => l.text)
  );
  console.log('\nWatch-related links:');
  navLinks.forEach(l => console.log('  ' + l.text.padEnd(55) + ' -> ' + l.href));

  // Get page headings
  const headings = await page.$$eval('h1,h2,h3', els =>
    els.slice(0, 20).map(el => el.innerText.trim()).filter(Boolean)
  );
  console.log('\nPage headings:', headings);

  // Get product count / any number hints
  const bodyText = await page.innerText('body');
  const productHints = bodyText.match(/\d+\s*(watches|products|results)/gi);
  console.log('\nProduct count hints:', productHints ? productHints.slice(0,5) : 'none');

  // Check for API calls in network
  const apiCalls = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('api') || url.includes('.json') || url.includes('product') || url.includes('graphql')) {
      apiCalls.push({ url: url.substring(0, 120), method: req.method() });
    }
  });

  // Reload to capture network
  await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
  console.log('\nAPI calls captured:');
  apiCalls.slice(0, 20).forEach(c => console.log('  ' + c.method + ' ' + c.url));

  await browser.close();
})().catch(e => { console.error('Error:', e.message); process.exit(1); });

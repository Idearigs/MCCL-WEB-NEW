const axios = require('axios');
const cheerio = require('cheerio');

const client = axios.create({
  timeout: 20000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
});

async function fetchStraps() {
  // Try the Shopify search API which often bypasses collection restrictions
  try {
    const searchRes = await client.get('https://www.briston-watches.com/en/search?type=product&q=strap&view=json');
    console.log('Search result (first 500):', JSON.stringify(searchRes.data).substring(0, 500));
  } catch (e) {
    console.log('Search API error:', e.message);
  }

  // Try fetching collection HTML and look for product JSON in page scripts
  const urls = [
    'https://www.briston-watches.com/en/collections/straps-18mm',
    'https://www.briston-watches.com/en/collections/straps',
  ];

  for (const url of urls) {
    try {
      console.log('\nFetching:', url);
      const res = await client.get(url, { headers: { Accept: 'text/html' } });
      const $ = cheerio.load(res.data);

      // Look for product data in scripts
      $('script').each((_, el) => {
        const text = $(el).html() || '';
        if (text.includes('"products"') && text.includes('price') && text.length > 500) {
          try {
            const m = text.match(/"products"\s*:\s*(\[[\s\S]*?\])/);
            if (m) {
              const prods = JSON.parse(m[1]);
              console.log(`Found ${prods.length} products in script`);
              prods.slice(0, 5).forEach(p => console.log(' -', p.title || p.name, p.price));
            }
          } catch {}
        }
      });

      // Look for product cards in HTML
      const products = [];
      $('.product-item, .card, [class*="product-card"], .grid-item').each((_, el) => {
        const title = $(el).find('[class*="title"], h3, h2, .product__title').first().text().trim();
        const price = $(el).find('[class*="price"], .price').first().text().trim();
        const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');
        const link = $(el).find('a').first().attr('href');
        if (title && title.length > 2) products.push({ title, price, img: img?.substring(0, 80), link });
      });

      if (products.length > 0) {
        console.log(`HTML products found: ${products.length}`);
        products.forEach(p => console.log(' -', p.title, '|', p.price, '|', p.link));
      } else {
        console.log('No product cards found in HTML');
        // Log first 500 chars of body to understand structure
        console.log('Body sample:', $('body').text().trim().substring(0, 300));
      }
    } catch (e) {
      console.log('Error:', e.message);
    }
  }

  // Try fetching a known strap product handle
  const strapHandles = ['nato-strap-noir', 'nato-strap-black', 'rubber-strap-black', 'velcro-strap-black', 'sangle-nato-noire'];
  for (const handle of strapHandles) {
    try {
      const res = await client.get(`https://www.briston-watches.com/en/products/${handle}.json`);
      const p = res.data.product;
      if (p) {
        console.log(`\nFound strap: ${p.title} (${p.variants?.[0]?.price} EUR)`);
        console.log('  Handle:', p.handle);
        console.log('  Image:', p.images?.[0]?.src?.substring(0, 80));
      }
    } catch {}
  }
}

fetchStraps().catch(console.error);

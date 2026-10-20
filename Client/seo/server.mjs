#!/usr/bin/env node
/**
 * SEO head renderer
 * -----------------
 * The storefront is a client-side SPA, so every URL used to get the same static
 * index.html (same title, description and share image) with HTTP 200 — even for
 * pages that don't exist. Crawlers and social scrapers saw nothing page-specific.
 *
 * nginx serves static files itself and hands every *page* request to this server,
 * which returns index.html with a page-specific <head> injected:
 *   - <title>, meta description, canonical, robots
 *   - Open Graph / Twitter card (title, description, image)
 *   - JSON-LD: JewelryStore, Product (+ offer), BreadcrumbList, FAQPage
 *   - a real 404 status for unknown routes and missing products
 * and generates /sitemap.xml live from the API.
 *
 * The React app still renders the page body exactly as before. If this server is
 * down, nginx falls back to the plain static index.html (see Dockerfile.frontend).
 *
 * No dependencies — Node 18+ (global fetch).
 *   SEO_PORT       default 3001
 *   DIST_DIR       built SPA (index.html)     default /usr/share/nginx/html
 *   INFO_PAGES_TS  src/content/infoPages.ts   default <this dir>/infoPages.ts
 *   SEO_API_BASE   default https://api.mccullochjewellers.co.uk/api/v1
 *   SITE_URL       default https://mccullochjewellers.co.uk
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.SEO_PORT) || 3001;
const DIST = process.env.DIST_DIR || '/usr/share/nginx/html';
const INFO_TS = process.env.INFO_PAGES_TS || path.join(HERE, 'infoPages.ts');
const API = (process.env.SEO_API_BASE || 'https://api.mccullochjewellers.co.uk/api/v1').replace(/\/$/, '');
const SITE = (process.env.SITE_URL || 'https://mccullochjewellers.co.uk').replace(/\/$/, '');
const MEDIA = new URL(API).origin;

const BRAND = 'McCulloch Jewellers';
const DEFAULT_DESC = 'Engagement rings, wedding rings, fine jewellery and Swiss watches from McCulloch Jewellers in Beeston, Nottingham. Every ring set by hand in our own workshop, with bespoke design available.';
const DEFAULT_IMAGE = `${SITE}/logo.png`;

// ── Template ────────────────────────────────────────────────────────────────
// Strip the static head tags we replace per page, leaving a marker to inject at.
const HEAD_MARK = '<!--seo-head-->';
function loadTemplate() {
  let html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  html = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, HEAD_MARK)
    .replace(/<meta\s+name="(description|keywords|author|robots)"[^>]*>\s*/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
    .replace(/<!--\s*(Open Graph|Twitter Card) Meta Tags\s*-->\s*/gi, '');
  if (!html.includes(HEAD_MARK)) html = html.replace(/<head>/i, `<head>${HEAD_MARK}`);
  return html;
}
let TEMPLATE = loadTemplate();

// ── Info pages (generated copy from the client's Website Essentials doc) ─────
function loadInfo() {
  try {
    const src = fs.readFileSync(INFO_TS, 'utf8');
    const grab = (name, open, close) => {
      const start = src.indexOf(`= ${open}`, src.indexOf(`export const ${name}`)) + 2;
      const end = src.indexOf(`\n${close};`, start);
      return JSON.parse(src.slice(start, end + 2));
    };
    return { pages: grab('INFO_PAGES', '{', '}'), faqs: grab('FAQS', '[', ']') };
  } catch (e) {
    console.error('[seo] infoPages not loaded:', e.message);
    return { pages: {}, faqs: [] };
  }
}
const INFO = loadInfo();

// ── Helpers ─────────────────────────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const xmlEsc = esc;
const jsonLd = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
// Flatten copy to one line; a line without closing punctuation (a heading) gets a full stop.
const plain = (s) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\{metal\}/gi, 'gold or platinum')
  .split(/\n+/).map((l) => l.trim()).filter(Boolean).map((l, i, a) => (i < a.length - 1 && !/[.!?…:;,]$/.test(l) ? `${l}.` : l))
  .join(' ').replace(/\s+/g, ' ').trim();
function clip(s, n = 158) {
  s = plain(s);
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 20)).replace(/[\s,;:–—-]+$/, '') + '…';
}
const abs = (u) => (!u ? '' : /^https?:\/\//i.test(u) ? u : `${MEDIA}${u.startsWith('/') ? '' : '/'}${u}`);
const titleCase = (s) => String(s).toLowerCase().replace(/(^|[\s(/-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
const num = (v) => { const n = Number(String(v ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(n) && n > 0 ? n : null; };

// ── API with a small TTL cache ──────────────────────────────────────────────
// Returns parsed JSON, the string 'missing' for an explicit 404, or null when
// the API can't be reached (we then serve the generic head with 200 — never a
// false 404 just because the API hiccuped). On a failed refresh (timeout, 429,
// 5xx) the last good value is reused.
const cache = new Map();
async function api(p, ttlMs = 10 * 60_000) {
  const hit = cache.get(p);
  if (hit && hit.exp > Date.now()) return hit.v;
  let v = null;
  try {
    const r = await fetch(`${API}${p}`, { signal: AbortSignal.timeout(3000), headers: { accept: 'application/json' } });
    if (r.status === 404) v = 'missing';
    else if (r.ok) v = await r.json();
  } catch { /* unreachable / timeout */ }
  if (v === null) return hit ? hit.v : null;
  if (cache.size > 3000) cache.delete(cache.keys().next().value);
  cache.set(p, { v, exp: Date.now() + (v === 'missing' ? 2 * 60_000 : ttlMs) });
  return v;
}

// ── Static routes ───────────────────────────────────────────────────────────
const STATIC = {
  '/': { title: `${BRAND} | Engagement Rings, Fine Jewellery & Watches — Beeston, Nottingham`, desc: DEFAULT_DESC },
  '/rings': { title: 'Rings — Engagement, Wedding & Ready-to-Ship', desc: 'Engagement rings, wedding bands and ready-to-ship diamond and gemstone rings, set by hand in our Beeston workshop.' },
  '/engagement-rings': { title: 'Engagement Rings — Natural & Lab-Grown Diamonds', desc: 'Solitaire, halo, trilogy and vintage-inspired engagement rings. Choose your metal and diamond — every ring set by hand in our Beeston, Nottingham workshop.' },
  '/wedding-rings': { title: 'Wedding Rings — Gold, Platinum & Diamond Bands', desc: 'Wedding rings in 9ct and 18ct gold, platinum and palladium — court, flat and diamond-set bands for men and women, in every width and weight.' },
  '/earrings': { title: 'Earrings — Diamond Studs, Drops & Hoops', desc: 'Diamond and gemstone earrings — studs, drops, hoops and halo designs in gold and platinum.' },
  '/necklaces': { title: 'Necklaces & Pendants — Diamond and Gemstone', desc: 'Diamond and gemstone necklaces and pendants in gold and platinum.' },
  '/bracelets': { title: 'Bracelets — Diamond, Tennis & Gold Bracelets', desc: 'Diamond tennis bracelets, bangles and gold bracelets, made and finished in our own workshop.' },
  '/jewellery': { title: 'Fine Jewellery — Earrings, Necklaces & Bracelets', desc: 'Fine jewellery from McCulloch: diamond and gemstone earrings, necklaces, pendants and bracelets in gold and platinum.' },
  '/watches': { title: 'Watches — Roamer, Briston & Festina', desc: 'Swiss and designer watches from Roamer, Briston and Festina, available from McCulloch Jewellers in Beeston, Nottingham.' },
  '/roamer': { title: 'Roamer Watches — Swiss Made', desc: 'Roamer Swiss-made watches — automatic and quartz collections, available from McCulloch Jewellers.' },
  '/briston': { title: 'Briston Watches — Clubmaster & Streamliner', desc: 'Briston watches — Clubmaster, Streamliner and more, available from McCulloch Jewellers.' },
  '/festina': { title: 'Festina Watches', desc: 'Festina watches — chronographs, titanium and classic collections, available from McCulloch Jewellers.' },
  '/bespoke-design': { title: 'Bespoke Jewellery Design', desc: 'Design your own engagement ring or piece of jewellery. Meet the person who will make it — we sketch, you choose the stone, and we make it by hand in our workshop.' },
  '/our-story': { title: 'Our Story', desc: 'The family story behind McCulloch Jewellers — jewellers and goldsmiths in Beeston, Nottingham.' },
  '/contact': { title: 'Contact Us', desc: 'Contact McCulloch Jewellers — 7 The Square, Beeston, Nottingham NG9 2JG. Call 0115 925 7552 or send us a message.' },
  '/customer-service': { title: 'Customer Service', desc: 'Help with orders, delivery, returns, sizing, repairs and aftercare from McCulloch Jewellers.' },
};
// Duplicate URLs → the one we want indexed.
const ALIASES = {
  '/wedding': '/wedding-rings', '/festina-watches': '/festina', '/briston-watches': '/briston', '/roamer-watches': '/roamer',
  '/certificates': '/certificate-of-authenticity', '/size-guide': '/ring-size-guide', '/care': '/jewellery-care',
};
// Route path → INFO_PAGES slug (mirrors App.tsx).
const INFO_ROUTES = {
  '/visit-us': 'visit-us', '/trust-guarantees': 'guarantees', '/privacy': 'privacy', '/terms': 'terms', '/cookies': 'cookies',
  '/delivery': 'delivery', '/returns': 'returns', '/warranty': 'warranty', '/repairs': 'repairs', '/book-appointment': 'book-appointment',
  '/sustainability': 'sustainability', '/certificate-of-authenticity': 'certificate-of-authenticity', '/faqs': 'faqs',
  '/ring-size-guide': 'ring-size-guide', '/diamond-guide': 'diamond-guide', '/gemstone-guide': 'gemstone-guide',
  '/birthstone-guide': 'birthstone-guide', '/hallmark-guide': 'hallmark-guide', '/jewellery-care': 'jewellery-care',
};
// Real pages that shouldn't appear in search (account, basket, legacy duplicates).
const NOINDEX = /^\/(cart|checkout|thank-you|account|orders|favorites|verify-email|auth|admin|products|product|diamonds)(\/|$)/;
// Collections that have their own hand-built page rather than /collections/:slug.
const LEGACY_COLLECTIONS = new Set(['festina-classic-collection', 'briston-heritage-collection', 'roamer-swiss-tradition']);

const PRODUCT_PREFIX = new Set(['engagement-rings', 'rings', 'earrings', 'necklaces', 'bracelets', 'jewellery']);
const CATEGORY_LABEL = { 'engagement-rings': 'Engagement Rings', rings: 'Rings', earrings: 'Earrings', necklaces: 'Necklaces', bracelets: 'Bracelets', jewellery: 'Jewellery' };
const productPath = (p, fallbackPrefix = 'jewellery') => {
  const c = p?.category?.slug;
  return `/${PRODUCT_PREFIX.has(c) ? c : fallbackPrefix}/${p.slug}`;
};

const STORE = {
  '@context': 'https://schema.org',
  '@type': 'JewelryStore',
  '@id': `${SITE}/#store`,
  name: BRAND,
  url: SITE,
  logo: `${SITE}/logo.png`,
  image: `${SITE}/logo.png`,
  telephone: '+44 115 925 7552',
  address: { '@type': 'PostalAddress', streetAddress: '7 The Square', addressLocality: 'Beeston', addressRegion: 'Nottingham', postalCode: 'NG9 2JG', addressCountry: 'GB' },
};
const crumbs = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${p}` })),
});

// ── Resolve a path to head data ─────────────────────────────────────────────
// → { status, title, desc, image, canonical, robots, type, ld: [] }
async function resolve(pathname) {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
  const page = (o) => ({ status: 200, image: DEFAULT_IMAGE, type: 'website', ld: [], canonical: p, ...o });
  const notFound = () => ({ status: 404, title: 'Page not found', desc: DEFAULT_DESC, image: DEFAULT_IMAGE, robots: 'noindex', ld: [] });

  if (NOINDEX.test(p)) return page({ title: BRAND, desc: DEFAULT_DESC, robots: 'noindex, follow', canonical: null });

  const alias = ALIASES[p];
  const key = alias || p;
  if (STATIC[key]) {
    const s = STATIC[key];
    return page({ title: key === '/' ? s.title : `${s.title} | ${BRAND}`, desc: s.desc, canonical: key, ld: key === '/' ? [STORE] : [crumbs([['Home', '/'], [s.title.split(' — ')[0], key]])] });
  }
  if (key === '/faqs' && INFO.faqs.length) {
    const qs = INFO.faqs.flatMap((g) => g.items);
    return page({
      title: `Frequently Asked Questions | ${BRAND}`,
      desc: clip(`Answers to common questions about ${INFO.faqs.map((g) => g.category.toLowerCase()).slice(0, 5).join(', ')} and more at ${BRAND}.`),
      canonical: key,
      ld: [
        crumbs([['Home', '/'], ['FAQs', key]]),
        { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qs.map((f) => ({ '@type': 'Question', name: plain(f.q), acceptedAnswer: { '@type': 'Answer', text: plain(f.a) } })) },
      ],
    });
  }
  if (INFO_ROUTES[key]) {
    const info = INFO.pages[INFO_ROUTES[key]];
    if (info) {
      const first = info.sections?.flatMap((s) => [...(s.paras || []), ...(s.bullets || [])]).find((t) => plain(t).length > 40);
      return page({ title: `${info.title} | ${BRAND}`, desc: clip(first || `${info.title} — ${BRAND}.`), canonical: key, ld: [crumbs([['Home', '/'], [info.title, key]])] });
    }
    // Known route even if the copy didn't load — never 404 a real page.
    return page({ title: `${titleCase(key.slice(1).replace(/-/g, ' '))} | ${BRAND}`, desc: DEFAULT_DESC, canonical: key });
  }

  const seg = p.split('/').filter(Boolean);
  if (seg.length !== 2) return notFound();
  const [prefix, rawId] = seg;
  const id = encodeURIComponent(decodeURIComponent(rawId));

  // Jewellery / rings product
  if (PRODUCT_PREFIX.has(prefix)) {
    const r = await api(`/products/${id}`);
    if (r === 'missing') return notFound();
    const prod = r?.data?.product || r?.data;
    if (!prod?.name) return page({ title: BRAND, desc: DEFAULT_DESC });
    const canonical = productPath(prod, prefix);
    const catSlug = canonical.split('/')[1];
    // Engagement designs are named ("Rosalind"); say what they are.
    const label = catSlug === 'engagement-rings' && !/ring/i.test(prod.name) ? `${prod.name} Engagement Ring` : prod.name;
    const imgs = (prod.images || []).filter((m) => m.type !== 'video' && m.url).sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)).map((m) => abs(m.url));
    const price = num(prod.sale_price) || num(prod.base_price);
    const inStock = prod.is_live_stock || (prod.in_stock && Number(prod.stock_quantity) > 0);
    const desc = clip(prod.short_description && plain(prod.description).length < 60 ? prod.short_description : prod.description || prod.short_description || `${prod.name} from ${BRAND}.`);
    const productLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: label,
      description: clip(prod.description || prod.short_description || prod.name, 500),
      sku: prod.sku || undefined,
      image: imgs.slice(0, 6),
      brand: { '@type': 'Brand', name: BRAND },
      url: `${SITE}${canonical}`,
    };
    if (price) {
      // Engagement rings are priced live with the chosen diamond — base_price is the "from" price.
      productLd.offers = prod.nivoda_enabled
        ? { '@type': 'AggregateOffer', priceCurrency: 'GBP', lowPrice: price, offerCount: 1, availability: 'https://schema.org/MadeToOrder', seller: { '@id': STORE['@id'] } }
        : { '@type': 'Offer', priceCurrency: 'GBP', price, url: `${SITE}${canonical}`, itemCondition: 'https://schema.org/NewCondition', availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/MadeToOrder', seller: { '@id': STORE['@id'] } };
    }
    return page({
      title: `${label} | ${BRAND}`,
      desc,
      image: imgs[0] || DEFAULT_IMAGE,
      canonical,
      type: 'product',
      price,
      ld: [productLd, crumbs([['Home', '/'], [CATEGORY_LABEL[catSlug] || 'Jewellery', `/${catSlug}`], [label, canonical]])],
    });
  }

  // Watch
  if (prefix === 'watches') {
    const r = await api(`/watches/${id}`);
    if (r === 'missing') return notFound();
    const w = r?.data?.watch || r?.data;
    if (!w?.name) return page({ title: BRAND, desc: DEFAULT_DESC });
    const canonical = `/watches/${w.slug || rawId}`;
    const name = titleCase(w.name);
    const imgs = (w.images || []).map((m) => abs(m.image_url || m.url)).filter(Boolean);
    const price = num(w.sale_price) || num(w.base_price) || num(w.price);
    const brand = w.brand?.name;
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description: clip(w.description || w.short_description || name, 500),
      sku: w.sku || w.model_number || undefined,
      mpn: w.model_number || undefined,
      image: imgs.slice(0, 6),
      brand: brand ? { '@type': 'Brand', name: brand } : undefined,
      url: `${SITE}${canonical}`,
    };
    if (price) ld.offers = { '@type': 'Offer', priceCurrency: 'GBP', price, url: `${SITE}${canonical}`, itemCondition: 'https://schema.org/NewCondition', availability: w.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', seller: { '@id': STORE['@id'] } };
    const brandPath = brand && STATIC[`/${brand.toLowerCase()}`] ? `/${brand.toLowerCase()}` : '/watches';
    return page({
      title: `${name} | ${BRAND}`,
      desc: clip(w.description || w.short_description || `${name} — available from ${BRAND}.`),
      image: imgs[0] || DEFAULT_IMAGE,
      canonical,
      type: 'product',
      price,
      ld: [ld, crumbs([['Home', '/'], ['Watches', '/watches'], ...(brandPath !== '/watches' ? [[brand, brandPath]] : []), [name, canonical]])],
    });
  }

  // Watch collection
  if (prefix === 'collections') {
    if (LEGACY_COLLECTIONS.has(rawId)) return page({ title: `${titleCase(rawId.replace(/-/g, ' '))} | ${BRAND}`, desc: DEFAULT_DESC });
    const r = await api(`/watches/collections/${id}`);
    if (r === 'missing') return notFound();
    const c = r?.data?.collection || r?.data;
    if (!c?.name) return page({ title: BRAND, desc: DEFAULT_DESC });
    const brand = c.brand?.name;
    const title = brand && !c.name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${c.name}` : c.name;
    const canonical = `/collections/${c.slug || rawId}`;
    return page({
      title: `${title} Watches | ${BRAND}`,
      desc: clip(c.description && c.description.length > 40 ? c.description : `${title} watches — the full collection, available from ${BRAND} in Beeston, Nottingham.`),
      image: abs(c.image_url) || DEFAULT_IMAGE,
      canonical,
      ld: [crumbs([['Home', '/'], ['Watches', '/watches'], [title, canonical]])],
    });
  }

  // Wedding ring design
  if (prefix === 'wedding-rings' || prefix === 'wedding') {
    const r = await api(`/wedding/designs/${id}`);
    if (r === 'missing') return notFound();
    const d = r?.design;
    if (!d?.name) return page({ title: BRAND, desc: DEFAULT_DESC });
    const canonical = `/wedding-rings/${encodeURIComponent(d.id)}`;
    const name = /ring/i.test(d.name) ? d.name : `${d.name} Wedding Ring`;
    const hero = d.hero && (d.hero.Y || d.hero.W || d.hero.R || Object.values(d.hero)[0]);
    const low = num(d.priceFrom), high = num(d.priceTo);
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description: clip(d.shortDescription || d.descriptionExample || d.description || name, 500),
      sku: d.id,
      image: hero ? [abs(hero)] : undefined,
      brand: { '@type': 'Brand', name: BRAND },
      url: `${SITE}${canonical}`,
    };
    if (low) ld.offers = { '@type': 'AggregateOffer', priceCurrency: 'GBP', lowPrice: low, highPrice: high || low, offerCount: 1, availability: 'https://schema.org/MadeToOrder', seller: { '@id': STORE['@id'] } };
    return page({
      title: `${name} | ${BRAND}`,
      desc: clip(`${d.descriptionExample || d.shortDescription || d.description || name}${low ? ` From £${low.toLocaleString('en-GB')}.` : ''}`),
      image: hero ? abs(hero) : DEFAULT_IMAGE,
      canonical,
      type: 'product',
      price: low,
      ld: [ld, crumbs([['Home', '/'], ['Wedding Rings', '/wedding-rings'], [name, canonical]])],
    });
  }

  return notFound();
}

function renderHead(h) {
  const url = h.canonical ? `${SITE}${h.canonical === '/' ? '' : h.canonical}` : null;
  const tags = [
    `<title>${esc(h.title)}</title>`,
    `<meta name="description" content="${esc(h.desc)}" />`,
    h.robots ? `<meta name="robots" content="${esc(h.robots)}" />` : '',
    url ? `<link rel="canonical" href="${esc(url)}" />` : '',
    `<meta property="og:site_name" content="${BRAND}" />`,
    `<meta property="og:locale" content="en_GB" />`,
    `<meta property="og:type" content="${h.type === 'product' ? 'product' : 'website'}" />`,
    `<meta property="og:title" content="${esc(h.title)}" />`,
    `<meta property="og:description" content="${esc(h.desc)}" />`,
    url ? `<meta property="og:url" content="${esc(url)}" />` : '',
    `<meta property="og:image" content="${esc(h.image)}" />`,
    h.price ? `<meta property="product:price:amount" content="${h.price}" />\n    <meta property="product:price:currency" content="GBP" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(h.title)}" />`,
    `<meta name="twitter:description" content="${esc(h.desc)}" />`,
    `<meta name="twitter:image" content="${esc(h.image)}" />`,
    ...(h.ld || []).map(jsonLd),
  ].filter(Boolean);
  return TEMPLATE.replace(HEAD_MARK, tags.join('\n    ') + '\n    ');
}

// ── Sitemap ─────────────────────────────────────────────────────────────────
let sitemap = { xml: null, exp: 0 };
// Every live product slug → its page, refreshed with the sitemap (hourly). Lets old /products/x
// URLs be checked without an API call per request.
let liveProducts = { map: null, at: 0 };

// One build at a time: concurrent callers share it (and the product list it fills).
let sitemapBuilding = null;
const buildSitemap = () => (sitemapBuilding ??= buildSitemapNow().finally(() => { sitemapBuilding = null; }));

async function buildSitemapNow() {
  if (sitemap.xml && sitemap.exp > Date.now()) return sitemap.xml;
  const urls = new Map(); // path → priority
  const add = (p, pr) => { if (!urls.has(p)) urls.set(p, pr); };
  add('/', '1.0');
  for (const k of Object.keys(STATIC)) add(k, '0.8');
  for (const k of Object.keys(INFO_ROUTES)) add(k, '0.4');

  const [prods, watches, colls, wedding] = await Promise.all([
    Promise.all(['engagement-rings', 'rings', 'earrings', 'necklaces', 'bracelets'].map((c) => api(`/products?category=${c}&limit=1000`, 60 * 60_000))),
    api('/watches?limit=2000', 60 * 60_000),
    api('/watches/collections/all', 60 * 60_000),
    api('/wedding/designs', 60 * 60_000),
  ]);
  let ok = true;
  const slugs = new Map();
  for (const r of prods) {
    const list = r?.data?.products || r?.products;
    if (!list) { ok = false; continue; }
    for (const p of list) if (p.slug) { add(productPath(p), '0.7'); slugs.set(p.slug.toLowerCase(), productPath(p)); }
  }
  if (prods.every((r) => r?.data?.products || r?.products)) liveProducts = { map: slugs, at: Date.now() };
  const wl = watches?.data?.watches;
  if (wl) for (const w of wl) { if (w.slug) add(`/watches/${w.slug}`, '0.5'); } else ok = false;
  const cl = Array.isArray(colls?.data) ? colls.data : colls?.data?.collections;
  if (cl) for (const c of cl) { if (c.slug && !LEGACY_COLLECTIONS.has(c.slug)) add(`/collections/${c.slug}`, '0.5'); } else ok = false;
  if (wedding?.designs) for (const d of wedding.designs) add(`/wedding-rings/${encodeURIComponent(d.id)}`, '0.5'); else ok = false;

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + [...urls].map(([p, pr]) => `  <url><loc>${xmlEsc(SITE + (p === '/' ? '/' : p))}</loc><priority>${pr}</priority></url>`).join('\n')
    + '\n</urlset>\n';
  // A partial build (API hiccup) is only kept briefly, and never replaces a complete one.
  if (ok || !sitemap.xml) sitemap = { xml, exp: Date.now() + (ok ? 60 * 60_000 : 5 * 60_000) };
  return sitemap.xml;
}

// ── Legacy URLs (old WordPress and Shopify sites) ───────────────────────────
// Only consulted for paths the new site doesn't serve, so a live page can never be
// redirected. Old one-off products have no exact match, so they go to the closest
// category by the words in their URL; obvious junk gets 410 Gone.
const GONE = 'GONE';
const LOCALE = /^\/(en|es|tr|fr|de|it|nl|[a-z]{2}-[a-z]{2})(?=\/|$)/;
const LEGACY_PAGES = {
  'bespoke-jewellery': '/bespoke-design', 'bespoke': '/bespoke-design', 'our-porfolio': '/portfolio', 'our-portfolio': '/portfolio',
  'photos-gallery': '/portfolio', 'portfolio': '/portfolio',
  'jewellery-repairs': '/repairs', 'jewellery-repair-quotes-bespoke-jewellery': '/repairs', 'clocks-repairs': '/repairs',
  'watch-repairs': '/repairs', 'repairs-and-services': '/repairs', 'services': '/repairs',
  'contact-us': '/contact', 'contact': '/contact', 'customer-help': '/contact', 'get-in-touch': '/contact',
  'about-us': '/our-story', 'about': '/our-story', 'our-story': '/our-story',
  'frequently-asked-questions': '/faqs', 'faq': '/faqs', 'faqs': '/faqs',
  'delivery': '/delivery', 'shipping': '/delivery', 'returns': '/returns', 'refund-policy': '/returns', 'returns-policy': '/returns',
  'privacy-policy': '/privacy', 'terms-of-service': '/terms', 'terms-and-conditions': '/terms',
  'ring-size-guide': '/ring-size-guide', 'size-guide': '/ring-size-guide', 'wishlist': '/favorites',
  'ring-size': '/ring-size-guide', 'ring-sizing-chart': '/ring-size-guide', 'ring-sizer': '/ring-size-guide',
  'diamonds': '/engagement-rings', 'nivoda-products': '/engagement-rings', 'diamond-guide': '/diamond-guide',
  'precious-jewellery': '/jewellery', 'vintage-jewellery': '/jewellery', 'detail-products': '/jewellery', 'jewellery': '/jewellery',
  'watches': '/watches', 'jewellery-care': '/jewellery-care', 'visit-us': '/visit-us', 'opening-hours': '/visit-us',
  'refund-policy': '/returns', 'refunds-exchange-policy': '/returns', 'terms-of-service': '/terms', 'shipping-policy': '/delivery',
  'made-to-order-jewellery': '/bespoke-design', 'plain-stuff': '/jewellery', 'uncategorized': '/jewellery',
  'wedding-and-engagement': '/rings', 'anniversary-jewellery': '/jewellery', 'machine-cut': '/wedding-rings',
  'diamond-set': '/wedding-rings', 'shaped': '/wedding-rings', 'plain': '/wedding-rings',
  'valuations': '/contact', 'track-my-order': '/account', 'testimonial': '/our-story', 'testimonials': '/our-story',
  'team-member': '/our-story', 'team': '/our-story', 'terms-of-use': '/terms', 'top-rated-products': '/jewellery',
  'shop-2': '/jewellery', 'search': '/', 'home': '/',
  'on-sale-product': '/jewellery', 'sale': '/jewellery', 'shop': '/jewellery', 'newsletter': '/',
};
const LEGACY_JUNK = /(^|[-/])(soaps?|scarf|scarves|creams?|wp-content|wp-admin|wp-json|wp-includes|web-pixels[^/]*|checkouts?|cart-2|order-an-envelope|other-element|[a-z-]*-elements?|product-attribute|recently-viewed-products|sample-page|social-share|webmail|shopify_pay|404-2|get-started-form|cdn|apps|tools|recommendations|monorail|https|cdn\.shopify\.com|\.well-known)([-/.]|$)|^\/api\//;

function categoryFor(words) {
  const w = ` ${words.toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;
  const has = (re) => re.test(w);
  if (has(/ (watch|watches|rotary|seiko|citizen|tissot|festina|roamer|briston|casio|sekonda|accurist) /)) return '/watches';
  if (has(/ (engagement|solitaire|proposal) /)) return '/engagement-rings';
  if (has(/ (wedding|bands?|court) /)) return '/wedding-rings';
  if (has(/ (earrings?|studs?|hoops?|drops?|creoles?) /)) return '/earrings';
  if (has(/ (bracelets?|bangles?|anklets?) /)) return '/bracelets';
  if (has(/ (pendants?|necklaces?|necklets?|lockets?|chains?|crosses|cross|charms?|chokers?) /)) return '/necklaces';
  if (has(/ (rings?|signets?|eternity|cluster|trilogy|halo) /)) return '/rings';
  return '/jewellery';
}

async function legacyTarget(rawPath) {
  let p = decodeURIComponent(rawPath).toLowerCase().replace(/\/+$/, '') || '/';
  if (LEGACY_JUNK.test(p)) return GONE;
  const loc = p.match(LOCALE);
  if (loc) {
    p = p.slice(loc[0].length) || '/';
    const alias = await productAlias(p);                  // /en-us/products/<live product> → its page
    if (alias) return alias;
    if (!/^\/products?\//.test(p) && (await resolve(p)).status === 200) return p; // /en-us/watches → /watches
  }
  const seg = p.split('/').filter(Boolean);
  if (seg.length === 0) return '/';
  // The new site's own product/catalogue URLs: a missing one stays a real 404 (it may be
  // hidden only for now), never a permanent redirect.
  if (!loc && seg.length >= 2 && (PRODUCT_PREFIX.has(seg[0]) || ['watches', 'wedding-rings', 'wedding', 'diamonds'].includes(seg[0]))) return null;
  // /products/x, /product/x, /collections/c/products/x
  const prodAt = seg.findIndex((s) => s === 'products' || s === 'product');
  if (prodAt >= 0 && seg[prodAt + 1]) return categoryFor(seg.slice(prodAt + 1).join(' '));
  if (seg[0] === 'collections' && seg[1]) return seg[1] === 'all' ? '/jewellery' : categoryFor(seg.slice(1).join(' '));
  if (seg[0] === 'blogs' || seg[0] === 'blog' || seg[0] === 'news') return '/blog/';
  if (seg[0] === 'pages' && seg[1]) return LEGACY_PAGES[seg[1]] || (categoryFor(seg[1]) !== '/jewellery' ? categoryFor(seg[1]) : '/');
  if (seg[0] === 'services') return '/repairs';
  if (seg[0] === 'my-account' || seg[0] === 'account') return '/account';
  if (seg[0] === 'product-category' || seg[0] === 'product-tag') return categoryFor(seg.slice(1).join(' '));
  if (seg[0] === 'policies' && seg[1]) return LEGACY_PAGES[seg[1]] || '/terms';
  // Old category pages, deepest segment first (/wedding-and-engagement/engagement-rings → /engagement-rings).
  for (const s of [...seg].reverse()) {
    if (LEGACY_PAGES[s]) return LEGACY_PAGES[s];
    const cat = categoryFor(s);
    if (cat !== '/jewellery') return cat;
  }
  return null;
}

// /products/:slug and /product/:slug are old-style duplicates of a real product's page.
async function productAlias(p) {
  const m = p.match(/^\/products?\/([^/]+)\/?$/i);
  if (!m) return undefined;
  if (!liveProducts.map || Date.now() - liveProducts.at > 2 * 60 * 60_000) await buildSitemap().catch(() => {});
  if (liveProducts.map) {
    const hit = liveProducts.map.get(decodeURIComponent(m[1]).toLowerCase());
    if (hit) return hit;
    if (Date.now() - liveProducts.at < 2 * 60 * 60_000) return null;
  }
  const r = await api(`/products/${encodeURIComponent(decodeURIComponent(m[1]))}`);
  if (r === 'missing' || !r) return r === 'missing' ? null : undefined; // undefined = unknown (API down): leave as is
  const prod = r?.data?.product || r?.data;
  return prod?.slug ? productPath(prod) : undefined;
}

// ── Server ──────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const send = (status, type, body, extra = {}) => {
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache', ...extra });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'text/plain', 'Method not allowed', { Allow: 'GET, HEAD' });
    if (url.pathname === '/__seo/health') return send(200, 'text/plain', 'ok');
    if (url.pathname === '/sitemap.xml') return send(200, 'application/xml; charset=utf-8', await buildSitemap(), { 'Cache-Control': 'public, max-age=3600' });
    // Anything with a file extension that nginx didn't find on disk is a missing file, not a page.
    const redirect = (to) => send(301, 'text/plain', `Moved to ${to}`, { Location: to, 'Cache-Control': 'public, max-age=86400' });
    // Old-site files (e.g. /wp-content/…/x.jpg) are gone for good; other missing files are plain 404s.
    if (/\.[a-z0-9]{1,5}$/i.test(url.pathname)) {
      return LEGACY_JUNK.test(url.pathname.toLowerCase()) ? send(410, 'text/plain', 'Gone') : send(404, 'text/plain', 'Not found');
    }
    const alias = await productAlias(url.pathname);
    if (alias) return redirect(alias);
    // Couldn't check (API busy): send people to the right category, temporarily, so Google retries later.
    const oldProduct = url.pathname.match(/^\/products?\/([^/]+)\/?$/i);
    if (alias === undefined && oldProduct && !liveProducts.map) {
      return send(302, 'text/plain', 'Found', { Location: categoryFor(oldProduct[1]), 'Cache-Control': 'no-store' });
    }
    const head = alias === null ? { status: 404 } : await resolve(url.pathname);
    if (head.status === 404) {
      const to = await legacyTarget(url.pathname);
      if (to === GONE) return send(410, 'text/html; charset=utf-8', renderHead({ status: 410, title: 'Page removed', desc: DEFAULT_DESC, image: DEFAULT_IMAGE, robots: 'noindex', ld: [] }));
      if (to && to !== url.pathname) return redirect(to);
      if (alias === null) return send(404, 'text/html; charset=utf-8', renderHead({ status: 404, title: 'Page not found', desc: DEFAULT_DESC, image: DEFAULT_IMAGE, robots: 'noindex', ld: [] }));
    }
    send(head.status, 'text/html; charset=utf-8', renderHead(head));
  } catch (e) {
    console.error('[seo]', req.url, e);
    send(200, 'text/html; charset=utf-8', TEMPLATE.replace(HEAD_MARK, `<title>${BRAND}</title>`));
  }
});

// Pick up a new index.html without a restart (e.g. a dist copied in place).
fs.watchFile(path.join(DIST, 'index.html'), { interval: 5000 }, () => {
  try { TEMPLATE = loadTemplate(); console.log('[seo] template reloaded'); } catch (e) { console.error('[seo] template reload failed', e.message); }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[seo] head renderer on 127.0.0.1:${PORT} → ${API}`);
  buildSitemap().catch(() => {}); // warm the product list used for legacy URL checks
});

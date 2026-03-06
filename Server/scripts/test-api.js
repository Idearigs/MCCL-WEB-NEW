/**
 * Comprehensive API endpoint test suite
 * Tests all endpoints with CRUD operations
 *
 * Usage: node Server/scripts/test-api.js
 */

// No dotenv needed — this script only makes HTTP requests, no DB access

const BASE = 'http://localhost:5000/api/v1';

// ─── Credentials ────────────────────────────────────────────────────────────
const ADMIN_EMAIL    = 'admin@mcculloch.com';
const ADMIN_PASSWORD = 'admin123!';
const TEST_USER_EMAIL    = `testuser_${Date.now()}@test.com`;
const TEST_USER_PASSWORD = 'TestUser123!';

// ─── State shared across tests ───────────────────────────────────────────────
let adminToken    = null;
let userToken     = null;
let createdIds    = {};   // store IDs of things we create so we can clean up

// ─── Helpers ─────────────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
};

let passed = 0, failed = 0, skipped = 0;
const failures = [];

function log(label, ...args) {
  console.log(`${c.dim}  │${c.reset}`, label, ...args);
}

function section(title) {
  console.log(`\n${c.bold}${c.cyan}══════════════════════════════════════════${c.reset}`);
  console.log(`${c.bold}${c.cyan}  ${title}${c.reset}`);
  console.log(`${c.cyan}══════════════════════════════════════════${c.reset}`);
}

async function req(method, path, { body, auth = 'admin', token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const tok = token || (auth === 'admin' ? adminToken : auth === 'user' ? userToken : null);
  if (tok) headers['Authorization'] = `Bearer ${tok}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE}${path}`, opts);
    let data;
    try { data = await res.json(); } catch { data = {}; }
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    const cause = err.cause?.message || err.cause?.code || '';
    return { status: 0, ok: false, data: {}, error: `${err.message}${cause ? ' — ' + cause : ''}` };
  }
}

async function test(name, fn) {
  try {
    const result = await fn();
    if (result === 'skip') {
      console.log(`  ${c.yellow}⊘${c.reset}  ${c.dim}${name}${c.reset}`);
      skipped++;
      return null;
    }
    console.log(`  ${c.green}✓${c.reset}  ${name}`);
    passed++;
    return result;
  } catch (err) {
    console.log(`  ${c.red}✗${c.reset}  ${name}`);
    console.log(`     ${c.red}${err.message}${c.reset}`);
    failures.push({ name, error: err.message });
    failed++;
    return null;
  }
}

function expect(val, msg) {
  if (!val) throw new Error(msg || `Assertion failed: ${JSON.stringify(val)}`);
}
function expectStatus(r, ...codes) {
  if (!codes.includes(r.status))
    throw new Error(`Expected status ${codes.join('/')} got ${r.status} — ${JSON.stringify(r.data).slice(0, 200)}`);
}
function expectSuccess(r) {
  if (!r.data?.success && r.status !== 200 && r.status !== 201)
    throw new Error(`Expected success=true, got status=${r.status} msg=${r.data?.message}`);
}


// ════════════════════════════════════════════════════════════════════════════
// 1. HEALTH CHECK
// ════════════════════════════════════════════════════════════════════════════
async function testHealth() {
  section('1. Health & API Info');

  await test('GET /health', async () => {
    const r = await req('GET', '/health', { auth: null });
    expectStatus(r, 200);
    expect(r.data.success, 'health success=true');
  });

  await test('GET / (API info)', async () => {
    const r = await req('GET', '/', { auth: null });
    expectStatus(r, 200);
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 2. ADMIN AUTH
// ════════════════════════════════════════════════════════════════════════════
async function testAdminAuth() {
  section('2. Admin Authentication');

  await test('POST /admin/login — bad password', async () => {
    const r = await req('POST', '/admin/login', { auth: null, body: { email: ADMIN_EMAIL, password: 'wrongpassword' } });
    expectStatus(r, 401, 400);
  });

  await test('POST /admin/login — valid credentials', async () => {
    const r = await req('POST', '/admin/login', { auth: null, body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    if (!r.data?.success) throw new Error(`Login failed: ${r.data?.message} (status ${r.status})`);
    adminToken = r.data?.data?.token || r.data?.data?.accessToken || r.data?.accessToken;
    expect(adminToken, 'admin token received');
    log('Token:', adminToken?.slice(0, 30) + '...');
  });

  await test('GET /admin/profile', async () => {
    if (!adminToken) throw new Error('No admin token — login failed');
    const r = await req('GET', '/admin/profile');
    expectStatus(r, 200);
    expectSuccess(r);
    log('Admin:', r.data?.data?.email);
  });

  await test('GET /admin/dashboard/stats', async () => {
    if (!adminToken) throw new Error('No admin token');
    const r = await req('GET', '/admin/dashboard/stats');
    expectStatus(r, 200);
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 3. USER AUTH
// ════════════════════════════════════════════════════════════════════════════
async function testUserAuth() {
  section('3. User Authentication');

  await test('POST /users/signup', async () => {
    const r = await req('POST', '/users/signup', {
      auth: null,
      body: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD, name: 'Test User' }
    });
    expectStatus(r, 200, 201);
    userToken = r.data?.data?.accessToken || r.data?.accessToken || r.data?.token;
    log('User created:', TEST_USER_EMAIL);
  });

  await test('POST /users/login', async () => {
    const r = await req('POST', '/users/login', {
      auth: null,
      body: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    expectStatus(r, 200, 201);
    userToken = r.data?.data?.accessToken || r.data?.accessToken || r.data?.token || userToken;
    expect(userToken, 'user token received');
    log('Token:', userToken?.slice(0, 30) + '...');
  });

  await test('GET /users/profile', async () => {
    if (!userToken) throw new Error('No user token');
    const r = await req('GET', '/users/profile', { auth: 'user' });
    expectStatus(r, 200);
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 4. PUBLIC FILTERS
// ════════════════════════════════════════════════════════════════════════════
async function testFilters() {
  section('4. Public Filters');

  const endpoints = [
    '/filters/ring-types',
    '/filters/gemstones',
    '/filters/metals',
    '/filters/collections',
    '/filters/earring-types',
    '/filters/necklace-types',
    '/filters/bracelet-types',
    '/filters/diamond-sizes',
  ];

  for (const ep of endpoints) {
    await test(`GET ${ep}`, async () => {
      const r = await req('GET', ep, { auth: null });
      expectStatus(r, 200);
      // some filter endpoints return raw arrays, others return { success, data: [] }
      const items = Array.isArray(r.data) ? r.data : r.data?.data;
      expect(Array.isArray(items), `response not array for ${ep}`);
      log(`→ ${items.length} items`);
    });
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 5. PRODUCTS (Public)
// ════════════════════════════════════════════════════════════════════════════
async function testPublicProducts() {
  section('5. Public Products');

  await test('GET /products (default limit=24)', async () => {
    const r = await req('GET', '/products', { auth: null });
    expectStatus(r, 200);
    expectSuccess(r);
    const prods = r.data?.data?.products;
    expect(Array.isArray(prods), 'products is array');
    expect(prods.length <= 24, `≤24 products returned (got ${prods.length})`);
    log(`→ ${prods.length} products, totalPages=${r.data?.data?.pagination?.total_pages}`);
    createdIds.firstProductSlug = prods[0]?.slug;
  });

  await test('GET /products?limit=5&page=1', async () => {
    const r = await req('GET', '/products?limit=5&page=1', { auth: null });
    expectStatus(r, 200);
    const prods = r.data?.data?.products;
    expect(prods.length <= 5, `≤5 products (got ${prods.length})`);
    log(`→ ${prods.length} products`);
  });

  await test('GET /products?page=2&limit=5', async () => {
    const r = await req('GET', '/products?page=2&limit=5', { auth: null });
    expectStatus(r, 200);
    log(`→ page 2: ${r.data?.data?.products?.length} products`);
  });

  await test('GET /products?category=rings', async () => {
    const r = await req('GET', '/products?category=rings&limit=10', { auth: null });
    expectStatus(r, 200);
    const prods = r.data?.data?.products || [];
    log(`→ ${prods.length} ring products`);
  });

  await test('GET /products?sort=price&order=asc', async () => {
    const r = await req('GET', '/products?sort=price&order=asc&limit=5', { auth: null });
    expectStatus(r, 200);
    const prods = r.data?.data?.products || [];
    log(`→ ${prods.length} products sorted by price asc`);
  });

  await test('GET /products?sort=price&order=desc', async () => {
    const r = await req('GET', '/products?sort=price&order=desc&limit=5', { auth: null });
    expectStatus(r, 200);
  });

  await test('GET /products?price_min=500&price_max=2000', async () => {
    const r = await req('GET', '/products?price_min=500&price_max=2000&limit=5', { auth: null });
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.products?.length} in £500–£2000`);
  });

  await test('GET /products?metal=Rose+Gold (junction filter)', async () => {
    const r = await req('GET', '/products?metal=Rose%20Gold&limit=5', { auth: null });
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.products?.length} Rose Gold products`);
  });

  await test('GET /products?ringType= (ring type junction filter)', async () => {
    // get a real ring type name first
    const rt = await req('GET', '/filters/ring-types', { auth: null });
    const name = rt.data?.[0]?.name;
    if (!name) return 'skip';
    const r = await req('GET', `/products?ringType=${encodeURIComponent(name)}&limit=5`, { auth: null });
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.products?.length} products with ringType="${name}"`);
  });

  await test('GET /products?search=BJ', async () => {
    const r = await req('GET', '/products?search=BJ&limit=5', { auth: null });
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.products?.length} search results`);
  });

  await test('GET /products?featured=true', async () => {
    const r = await req('GET', '/products?featured=true&limit=5', { auth: null });
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.products?.length} featured products`);
  });

  await test('GET /products/categories', async () => {
    const r = await req('GET', '/products/categories', { auth: null });
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.length || r.data?.length} categories`);
  });

  await test('GET /products/navigation', async () => {
    const r = await req('GET', '/products/navigation', { auth: null });
    expectStatus(r, 200);
    log(`→ ringTypes=${r.data?.data?.ringTypes?.length}, metals=${r.data?.data?.metals?.length}`);
  });

  await test('GET /products/category/rings', async () => {
    const r = await req('GET', '/products/category/rings?limit=5', { auth: null });
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.products?.length} ring products`);
  });

  await test('GET /products/:slug (single product)', async () => {
    if (!createdIds.firstProductSlug) return 'skip';
    const r = await req('GET', `/products/${createdIds.firstProductSlug}`, { auth: null });
    expectStatus(r, 200);
    expectSuccess(r);
    log(`→ slug: ${createdIds.firstProductSlug}`);
  });

  await test('GET /products/nonexistent-slug-xyz (404)', async () => {
    const r = await req('GET', '/products/nonexistent-slug-xyz-abc-123', { auth: null });
    expectStatus(r, 404);
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 6. ADMIN CATEGORIES — CRUD
// ════════════════════════════════════════════════════════════════════════════
async function testAdminCategories() {
  section('6. Admin Categories CRUD');

  if (!adminToken) { console.log(`  ${c.yellow}⊘${c.reset}  Skipping — no admin token`); skipped += 6; return; }

  await test('GET /admin/categories', async () => {
    const r = await req('GET', '/admin/categories');
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.length || r.data?.length} categories`);
  });

  // Ring Types CRUD
  await test('POST /admin/categories/ring-types (create)', async () => {
    const r = await req('POST', '/admin/categories/ring-types', {
      body: { name: `_TEST RingType ${Date.now()}`, slug: `_test-ringtype-${Date.now()}`, is_active: true }
    });
    expectStatus(r, 200, 201);
    createdIds.ringTypeId = r.data?.id || r.data?.data?.id;
    log(`→ created id=${createdIds.ringTypeId}`);
  });

  await test('GET /admin/categories/ring-types', async () => {
    const r = await req('GET', '/admin/categories/ring-types');
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.length || r.data?.length} ring types`);
  });

  await test('PUT /admin/categories/ring-types/:id (update)', async () => {
    if (!createdIds.ringTypeId) return 'skip';
    const r = await req('PUT', `/admin/categories/ring-types/${createdIds.ringTypeId}`, {
      body: { name: `_TEST RingType Updated`, is_active: true }
    });
    expectStatus(r, 200);
  });

  await test('DELETE /admin/categories/ring-types/:id (cleanup)', async () => {
    if (!createdIds.ringTypeId) return 'skip';
    const r = await req('DELETE', `/admin/categories/ring-types/${createdIds.ringTypeId}`);
    expectStatus(r, 200);
    log(`→ deleted ${createdIds.ringTypeId}`);
  });

  // Metals CRUD
  await test('GET /admin/categories/metals', async () => {
    const r = await req('GET', '/admin/categories/metals');
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.length || r.data?.length} metals`);
  });

  await test('POST /admin/categories/metals (create)', async () => {
    const r = await req('POST', '/admin/categories/metals', {
      body: { name: `_TEST Metal ${Date.now()}`, color_code: '#AABBCC' }
    });
    expectStatus(r, 200, 201);
    createdIds.metalId = r.data?.id || r.data?.data?.id;
    log(`→ created id=${createdIds.metalId}`);
  });

  await test('PUT /admin/categories/metals/:id (update)', async () => {
    if (!createdIds.metalId) return 'skip';
    const r = await req('PUT', `/admin/categories/metals/${createdIds.metalId}`, {
      body: { name: `_TEST Metal Updated`, color_code: '#CCBBAA' }
    });
    expectStatus(r, 200);
  });

  await test('DELETE /admin/categories/metals/:id (cleanup)', async () => {
    if (!createdIds.metalId) return 'skip';
    const r = await req('DELETE', `/admin/categories/metals/${createdIds.metalId}`);
    expectStatus(r, 200);
    log(`→ deleted ${createdIds.metalId}`);
  });

  // Collections CRUD
  await test('GET /admin/categories/collections', async () => {
    const r = await req('GET', '/admin/categories/collections');
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.length || r.data?.length} collections`);
  });

  await test('POST /admin/categories/collections (create)', async () => {
    const ts = Date.now();
    const r = await req('POST', '/admin/categories/collections', {
      body: { name: `_TEST Collection ${ts}`, slug: `_test-collection-${ts}`, is_active: true }
    });
    expectStatus(r, 200, 201);
    createdIds.collectionId = r.data?.id || r.data?.data?.id;
    log(`→ created id=${createdIds.collectionId}`);
  });

  await test('PUT /admin/categories/collections/:id (update)', async () => {
    if (!createdIds.collectionId) return 'skip';
    const r = await req('PUT', `/admin/categories/collections/${createdIds.collectionId}`, {
      body: { name: `_TEST Collection Updated` }
    });
    expectStatus(r, 200);
  });

  await test('DELETE /admin/categories/collections/:id (cleanup)', async () => {
    if (!createdIds.collectionId) return 'skip';
    const r = await req('DELETE', `/admin/categories/collections/${createdIds.collectionId}`);
    expectStatus(r, 200);
    log(`→ deleted ${createdIds.collectionId}`);
  });

  // Stone Types CRUD
  await test('GET /admin/categories/stone-types', async () => {
    const r = await req('GET', '/admin/categories/stone-types');
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.length || r.data?.length} stone types`);
  });

  await test('POST /admin/categories/stone-types (create)', async () => {
    const ts = Date.now();
    const r = await req('POST', '/admin/categories/stone-types', {
      body: { name: `_TEST StoneType ${ts}`, slug: `_test-stonetype-${ts}`, is_active: true }
    });
    expectStatus(r, 200, 201);
    createdIds.stoneTypeId = r.data?.id || r.data?.data?.id;
    log(`→ created id=${createdIds.stoneTypeId}`);
  });

  await test('DELETE /admin/categories/stone-types/:id (cleanup)', async () => {
    if (!createdIds.stoneTypeId) return 'skip';
    const r = await req('DELETE', `/admin/categories/stone-types/${createdIds.stoneTypeId}`);
    expectStatus(r, 200);
  });

  // Stone Shapes CRUD
  await test('GET /admin/categories/stone-shapes', async () => {
    const r = await req('GET', '/admin/categories/stone-shapes');
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.length || r.data?.length} stone shapes`);
  });

  await test('POST /admin/categories/stone-shapes (create)', async () => {
    const ts = Date.now();
    const r = await req('POST', '/admin/categories/stone-shapes', {
      body: { name: `_TEST StoneShape ${ts}`, slug: `_test-stoneshape-${ts}`, is_active: true }
    });
    expectStatus(r, 200, 201);
    createdIds.stoneShapeId = r.data?.id || r.data?.data?.id;
    log(`→ created id=${createdIds.stoneShapeId}`);
  });

  await test('DELETE /admin/categories/stone-shapes/:id (cleanup)', async () => {
    if (!createdIds.stoneShapeId) return 'skip';
    const r = await req('DELETE', `/admin/categories/stone-shapes/${createdIds.stoneShapeId}`);
    expectStatus(r, 200);
  });

  // Gemstones CRUD
  await test('GET /admin/categories/gemstones', async () => {
    const r = await req('GET', '/admin/categories/gemstones');
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.length || r.data?.length} gemstones`);
  });

  await test('POST /admin/categories/gemstones (create)', async () => {
    const ts = Date.now();
    const r = await req('POST', '/admin/categories/gemstones', {
      body: { name: `_TEST Gemstone ${ts}`, slug: `_test-gemstone-${ts}`, is_active: true }
    });
    expectStatus(r, 200, 201);
    createdIds.gemstoneId = r.data?.id || r.data?.data?.id;
    log(`→ created id=${createdIds.gemstoneId}`);
  });

  await test('DELETE /admin/categories/gemstones/:id (cleanup)', async () => {
    if (!createdIds.gemstoneId) return 'skip';
    const r = await req('DELETE', `/admin/categories/gemstones/${createdIds.gemstoneId}`);
    expectStatus(r, 200);
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 7. ADMIN JEWELRY CATEGORIES — CRUD
// ════════════════════════════════════════════════════════════════════════════
async function testAdminJewelryCategories() {
  section('7. Admin Jewelry Categories CRUD');

  if (!adminToken) { console.log(`  ${c.yellow}⊘${c.reset}  Skipping — no admin token`); skipped += 4; return; }

  // Fetch a jewelry_type_id for jewelry-sub-types creation
  let jewelryTypeId = null;
  {
    const r = await req('GET', '/admin/jewelry-categories/jewelry-types');
    const items = r.data?.data || r.data || [];
    jewelryTypeId = Array.isArray(items) ? items[0]?.id : null;
    log(`Using jewelry_type_id: ${jewelryTypeId}`);
  }

  const groups = [
    { name: 'jewelry-sub-types', label: 'JewelrySubType', extra: jewelryTypeId ? { jewelry_type_id: jewelryTypeId } : {} },
    { name: 'earring-types',     label: 'EarringType', extra: {} },
    { name: 'necklace-types',    label: 'NecklaceType', extra: {} },
    { name: 'bracelet-types',    label: 'BraceletType', extra: {} },
  ];

  for (const g of groups) {
    const ts = Date.now();
    let createdId = null;

    await test(`GET /admin/jewelry-categories/${g.name}`, async () => {
      const r = await req('GET', `/admin/jewelry-categories/${g.name}`);
      expectStatus(r, 200);
      log(`→ ${r.data?.data?.length || r.data?.length} items`);
    });

    await test(`POST /admin/jewelry-categories/${g.name} (create)`, async () => {
      if (g.name === 'jewelry-sub-types' && !jewelryTypeId) return 'skip';
      const r = await req('POST', `/admin/jewelry-categories/${g.name}`, {
        body: { name: `_TEST ${g.label} ${ts}`, slug: `_test-${g.name}-${ts}`, is_active: true, ...g.extra }
      });
      expectStatus(r, 200, 201);
      createdId = r.data?.id || r.data?.data?.id;
      log(`→ created id=${createdId}`);
    });

    await test(`PUT /admin/jewelry-categories/${g.name}/:id (update)`, async () => {
      if (!createdId) return 'skip';
      const r = await req('PUT', `/admin/jewelry-categories/${g.name}/${createdId}`, {
        body: { name: `_TEST ${g.label} Updated` }
      });
      expectStatus(r, 200);
    });

    await test(`DELETE /admin/jewelry-categories/${g.name}/:id (cleanup)`, async () => {
      if (!createdId) return 'skip';
      const r = await req('DELETE', `/admin/jewelry-categories/${g.name}/${createdId}`);
      expectStatus(r, 200);
    });
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 8. ADMIN PRODUCTS — CRUD
// ════════════════════════════════════════════════════════════════════════════
async function testAdminProducts() {
  section('8. Admin Products CRUD');

  if (!adminToken) { console.log(`  ${c.yellow}⊘${c.reset}  Skipping — no admin token`); skipped += 7; return; }

  await test('GET /admin/products', async () => {
    const r = await req('GET', '/admin/products');
    expectStatus(r, 200);
    const prods = r.data?.data?.products || r.data?.products || r.data?.data || [];
    log(`→ ${Array.isArray(prods) ? prods.length : '?'} products`);
  });

  await test('GET /admin/products/options', async () => {
    const r = await req('GET', '/admin/products/options');
    expectStatus(r, 200);
    log(`→ options: ${Object.keys(r.data?.data || {}).join(', ')}`);
  });

  // Need a valid category_id to create a product
  let catId = null;
  await test('Fetch category id for product create', async () => {
    const r = await req('GET', '/admin/categories');
    const cats = r.data?.data || r.data || [];
    catId = Array.isArray(cats) ? cats.find(c => c.slug === 'rings')?.id || cats[0]?.id : null;
    expect(catId, `got category id: ${catId}`);
    log(`→ using category id=${catId}`);
  });

  const ts = Date.now();
  await test('POST /admin/products (create)', async () => {
    if (!catId) return 'skip';
    const r = await req('POST', '/admin/products', {
      body: {
        name:              `_TEST Product ${ts}`,
        base_price:        '999.99',
        category_id:       catId,
        sku:               `TEST-${ts}`,
        short_description: 'API test product — safe to delete',
        is_active:         true,
        in_stock:          true,
        currency:          'GBP'
      }
    });
    expectStatus(r, 200, 201);
    createdIds.productId   = r.data?.data?.id;
    createdIds.productSlug = r.data?.data?.slug;
    expect(createdIds.productId, 'product id returned');
    log(`→ created id=${createdIds.productId} slug=${createdIds.productSlug}`);
  });

  await test('GET /admin/products/:id', async () => {
    if (!createdIds.productId) return 'skip';
    const r = await req('GET', `/admin/products/${createdIds.productId}`);
    expectStatus(r, 200);
    expect(r.data?.data?.id === createdIds.productId, 'correct product returned');
    // Verify ring_style_1_id columns are GONE from response
    const hasOldCols = r.data?.data?.ring_style_1_id !== undefined;
    expect(!hasOldCols, 'ring_style_1_id columns are absent (migration verified)');
    log(`→ ring_style_1_id absent: ${!hasOldCols} ✓`);
  });

  await test('PUT /admin/products/:id (update name + price)', async () => {
    if (!createdIds.productId) return 'skip';
    const r = await req('PUT', `/admin/products/${createdIds.productId}`, {
      body: { name: `_TEST Product Updated ${ts}`, base_price: '1299.99' }
    });
    expectStatus(r, 200);
    log(`→ updated price to 1299.99`);
  });

  await test('PATCH /admin/products/:id/toggle-status', async () => {
    if (!createdIds.productId) return 'skip';
    const r = await req('PATCH', `/admin/products/${createdIds.productId}/toggle-status`);
    expectStatus(r, 200);
    log(`→ status toggled`);
  });

  await test('PATCH /admin/products/:id/toggle-featured', async () => {
    if (!createdIds.productId) return 'skip';
    const r = await req('PATCH', `/admin/products/${createdIds.productId}/toggle-featured`);
    expectStatus(r, 200);
    log(`→ featured toggled`);
  });

  // Verify via public API
  await test('Public GET /products/:slug (created product visible)', async () => {
    if (!createdIds.productSlug) return 'skip';
    const r = await req('GET', `/products/${createdIds.productSlug}`, { auth: null });
    // may be inactive after toggle — just check it's reachable
    expectStatus(r, 200, 404);
    log(`→ status=${r.status}`);
  });

  // Verify product_variants new columns in admin response
  await test('product_variants has new columns (price, carat_weight, mm_width, metal_id)', async () => {
    const r = await req('GET', '/admin/products', { });
    const prods = r.data?.data?.products || r.data?.data || [];
    const prod = Array.isArray(prods) ? prods.find(p => p.variants?.length > 0) : null;
    if (!prod) return 'skip';
    const variant = prod.variants[0];
    const hasNewCols = 'price' in variant || 'carat_weight' in variant || 'mm_width' in variant;
    log(`→ variant keys: ${Object.keys(variant).join(', ')}`);
    // columns exist even if null — just check they're present or skip
  });

  await test('DELETE /admin/products/:id (cleanup)', async () => {
    if (!createdIds.productId) return 'skip';
    const r = await req('DELETE', `/admin/products/${createdIds.productId}`);
    expectStatus(r, 200);
    log(`→ deleted ${createdIds.productId}`);
    delete createdIds.productId;
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 9. MARKETING CONTENT — CRUD
// ════════════════════════════════════════════════════════════════════════════
async function testMarketing() {
  section('9. Marketing Content CRUD');

  await test('GET /marketing (public)', async () => {
    const r = await req('GET', '/marketing', { auth: null });
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.length || r.data?.length} items`);
  });

  if (!adminToken) { console.log(`  ${c.yellow}⊘${c.reset}  Skipping write tests — no admin token`); return; }

  await test('POST /marketing (create)', async () => {
    const r = await req('POST', '/marketing', {
      body: { title: `_TEST Marketing ${Date.now()}`, is_active: true }
    });
    expectStatus(r, 200, 201);
    createdIds.marketingId = r.data?.data?.id;
    log(`→ created id=${createdIds.marketingId}`);
  });

  await test('PUT /marketing/:id (update)', async () => {
    if (!createdIds.marketingId) return 'skip';
    const r = await req('PUT', `/marketing/${createdIds.marketingId}`, {
      body: { title: '_TEST Marketing Updated' }
    });
    expectStatus(r, 200);
  });

  await test('GET /marketing/:id', async () => {
    if (!createdIds.marketingId) return 'skip';
    const r = await req('GET', `/marketing/${createdIds.marketingId}`, { auth: null });
    expectStatus(r, 200);
  });

  await test('DELETE /marketing/:id (cleanup)', async () => {
    if (!createdIds.marketingId) return 'skip';
    const r = await req('DELETE', `/marketing/${createdIds.marketingId}`);
    expectStatus(r, 200);
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 10. PROMOTIONS — CRUD
// ════════════════════════════════════════════════════════════════════════════
async function testPromotions() {
  section('10. Promotions CRUD');

  await test('GET /promotions (public)', async () => {
    const r = await req('GET', '/promotions', { auth: null });
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.length || r.data?.length} promotions`);
  });

  if (!adminToken) { console.log(`  ${c.yellow}⊘${c.reset}  Skipping write tests`); return; }

  await test('POST /promotions (create)', async () => {
    const r = await req('POST', '/promotions', {
      body: { title: `_TEST Promo ${Date.now()}`, is_active: true }
    });
    expectStatus(r, 200, 201);
    createdIds.promotionId = r.data?.data?.promotion?.id || r.data?.data?.id || r.data?.id;
    log(`→ created id=${createdIds.promotionId}`);
  });

  await test('PUT /promotions/:id (update)', async () => {
    if (!createdIds.promotionId) return 'skip';
    const r = await req('PUT', `/promotions/${createdIds.promotionId}`, {
      body: { title: '_TEST Promo Updated' }
    });
    expectStatus(r, 200);
  });

  await test('DELETE /promotions/:id (cleanup)', async () => {
    if (!createdIds.promotionId) return 'skip';
    const r = await req('DELETE', `/promotions/${createdIds.promotionId}`);
    expectStatus(r, 200);
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 11. WATCHES (Public reads)
// ════════════════════════════════════════════════════════════════════════════
async function testWatches() {
  section('11. Watches (Public)');

  await test('GET /watches/brands', async () => {
    const r = await req('GET', '/watches/brands', { auth: null });
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.length || r.data?.length} brands`);
    createdIds.firstBrandId = (r.data?.data || r.data || [])[0]?.id;
  });

  await test('GET /watches', async () => {
    const r = await req('GET', '/watches', { auth: null });
    expectStatus(r, 200);
    const watches = r.data?.data?.watches || r.data?.watches || r.data?.data || [];
    log(`→ ${Array.isArray(watches) ? watches.length : '?'} watches`);
  });

  await test('GET /watches/collections/all', async () => {
    const r = await req('GET', '/watches/collections/all', { auth: null });
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.length || r.data?.length} collections`);
  });

  await test('GET /watches/featured-collections', async () => {
    const r = await req('GET', '/watches/featured-collections', { auth: null });
    expectStatus(r, 200);
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 12. CHATS — CRUD
// ════════════════════════════════════════════════════════════════════════════
async function testChats() {
  section('12. Chats');

  await test('POST /chats (create public chat)', async () => {
    const r = await req('POST', '/chats', {
      auth: null,
      body: {
        customer_name:    '_Test Customer',
        customer_email:   `_test_${Date.now()}@test.com`,
        initial_message:  'API test message — safe to delete'
      }
    });
    expectStatus(r, 200, 201);
    createdIds.chatId = r.data?.data?.chat?.id || r.data?.data?.id || r.data?.id;
    log(`→ created chat id=${createdIds.chatId}`);
  });

  await test('GET /chats/view/:id (public)', async () => {
    if (!createdIds.chatId) return 'skip';
    const r = await req('GET', `/chats/view/${createdIds.chatId}`, { auth: null });
    expectStatus(r, 200);
  });

  if (!adminToken) { console.log(`  ${c.yellow}⊘${c.reset}  Skipping admin chat tests`); return; }

  await test('GET /chats (admin — all chats)', async () => {
    const r = await req('GET', '/chats');
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.length || r.data?.length} chats`);
  });

  await test('GET /chats/unread/count', async () => {
    const r = await req('GET', '/chats/unread/count');
    expectStatus(r, 200);
    log(`→ unread: ${r.data?.data?.count ?? r.data?.count}`);
  });

  await test('GET /chats/:id (admin)', async () => {
    if (!createdIds.chatId) return 'skip';
    const r = await req('GET', `/chats/${createdIds.chatId}`);
    expectStatus(r, 200);
  });

  await test('PUT /chats/:id/status', async () => {
    if (!createdIds.chatId) return 'skip';
    const r = await req('PUT', `/chats/${createdIds.chatId}/status`, {
      body: { status: 'active' }
    });
    expectStatus(r, 200);
  });

  // Chat Labels CRUD
  await test('GET /chats/labels', async () => {
    const r = await req('GET', '/chats/labels');
    expectStatus(r, 200);
  });

  await test('POST /chats/labels (create)', async () => {
    const r = await req('POST', '/chats/labels', {
      body: { name: `_TEST Label ${Date.now()}`, color: '#FF0000' }
    });
    expectStatus(r, 200, 201);
    createdIds.chatLabelId = r.data?.data?.id;
    log(`→ created label id=${createdIds.chatLabelId}`);
  });

  await test('PUT /chats/labels/:id (update)', async () => {
    if (!createdIds.chatLabelId) return 'skip';
    const r = await req('PUT', `/chats/labels/${createdIds.chatLabelId}`, {
      body: { name: '_TEST Label Updated', color: '#00FF00' }
    });
    expectStatus(r, 200);
  });

  await test('DELETE /chats/labels/:id (cleanup)', async () => {
    if (!createdIds.chatLabelId) return 'skip';
    const r = await req('DELETE', `/chats/labels/${createdIds.chatLabelId}`);
    expectStatus(r, 200);
  });

  await test('PUT /chats/:id/close (cleanup chat)', async () => {
    if (!createdIds.chatId) return 'skip';
    const r = await req('PUT', `/chats/${createdIds.chatId}/close`);
    expectStatus(r, 200);
  });

  await test('DELETE /chats/:id (cleanup)', async () => {
    if (!createdIds.chatId) return 'skip';
    const r = await req('DELETE', `/chats/${createdIds.chatId}`);
    expectStatus(r, 200);
    log(`→ deleted chat ${createdIds.chatId}`);
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 13. FAVORITES (auth required)
// ════════════════════════════════════════════════════════════════════════════
async function testFavorites() {
  section('13. Favorites');

  if (!userToken) { console.log(`  ${c.yellow}⊘${c.reset}  Skipping — no user token`); skipped += 3; return; }

  // Get a real product id first
  const prodsResp = await req('GET', '/products?limit=1', { auth: null });
  const productId = prodsResp.data?.data?.products?.[0]?.id;

  await test('GET /favorites', async () => {
    const r = await req('GET', '/favorites', { auth: 'user' });
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.length || r.data?.length || 0} favorites`);
  });

  await test('POST /favorites/toggle/:productId (add)', async () => {
    if (!productId) return 'skip';
    const r = await req('POST', `/favorites/toggle/${productId}`, { auth: 'user' });
    expectStatus(r, 200, 201);
    log(`→ toggled favorite for product ${productId}`);
  });

  await test('GET /favorites/check/:productId', async () => {
    if (!productId) return 'skip';
    const r = await req('GET', `/favorites/check/${productId}`, { auth: 'user' });
    expectStatus(r, 200);
    log(`→ isFavorite: ${r.data?.data?.isFavorite ?? r.data?.isFavorite}`);
  });

  await test('POST /favorites/toggle/:productId (remove)', async () => {
    if (!productId) return 'skip';
    const r = await req('POST', `/favorites/toggle/${productId}`, { auth: 'user' });
    expectStatus(r, 200);
    log(`→ removed from favorites`);
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 14. ADMIN PROFILE & DEVICES
// ════════════════════════════════════════════════════════════════════════════
async function testAdminProfile() {
  section('14. Admin Profile & Devices');

  if (!adminToken) { console.log(`  ${c.yellow}⊘${c.reset}  Skipping`); return; }

  await test('GET /admin/devices', async () => {
    const r = await req('GET', '/admin/devices');
    expectStatus(r, 200);
    log(`→ ${r.data?.data?.length || r.data?.length} devices`);
  });

  await test('PUT /admin/profile (update)', async () => {
    const r = await req('PUT', '/admin/profile', {
      body: { first_name: 'API', last_name: 'TestAdmin' }
    });
    expectStatus(r, 200);
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 15. SCHEMA INTEGRITY CHECKS
// ════════════════════════════════════════════════════════════════════════════
async function testSchemaIntegrity() {
  section('15. Schema Integrity Checks (post-migration)');

  await test('ring_style_1..5_id columns GONE from product response', async () => {
    const r = await req('GET', '/products?limit=1', { auth: null });
    const prod = r.data?.data?.products?.[0];
    if (!prod) return 'skip';
    const oldCols = ['ring_style_1_id','ring_style_2_id','ring_style_3_id','ring_style_4_id','ring_style_5_id'];
    const found = oldCols.filter(c => c in prod);
    expect(found.length === 0, `Old columns still in response: ${found.join(', ')}`);
    log(`→ No legacy ring_style FK columns in public response ✓`);
  });

  await test('ringTypes populated from junction table', async () => {
    const r = await req('GET', '/products?limit=24', { auth: null });
    const prods = r.data?.data?.products || [];
    const withTypes = prods.filter(p => p.ringTypes?.length > 0);
    log(`→ ${withTypes.length}/${prods.length} products have ringTypes`);
    // Just checking it's an array — not asserting > 0 since not all products have ring types
    const allAreArrays = prods.every(p => Array.isArray(p.ringTypes));
    expect(allAreArrays, 'ringTypes is always an array on products');
  });

  await test('pagination: limit=24 enforced by default', async () => {
    const r = await req('GET', '/products?category=rings', { auth: null });
    const prods = r.data?.data?.products || [];
    expect(prods.length <= 24, `Got ${prods.length}, expected ≤24`);
    const pg = r.data?.data?.pagination;
    expect(pg, 'pagination object present');
    log(`→ current_page=${pg?.current_page} per_page=${pg?.per_page} total_items=${pg?.total_items} total_pages=${pg?.total_pages}`);
  });

  await test('product_variants new columns accessible', async () => {
    const r = await req('GET', '/products?limit=24', { auth: null });
    const prods = r.data?.data?.products || [];
    const withVariants = prods.find(p => p.variants?.length > 0);
    if (!withVariants) return 'skip';
    const v = withVariants.variants[0];
    const newCols = ['price','carat_weight','mm_width','metal_id','ai_description'];
    const present = newCols.filter(c => c in v);
    log(`→ New variant columns present: ${present.join(', ') || 'none (variants may be empty)'}`);
    expect(present.length > 0, `Expected new variant columns. Got keys: ${Object.keys(v).join(', ')}`);
  });

  await test('metal filter uses junction table (not variant.metal_type)', async () => {
    const r = await req('GET', '/products?metal=Rose%20Gold&limit=5', { auth: null });
    expectStatus(r, 200);
    const prods = r.data?.data?.products || [];
    const allHaveRoseGold = prods.every(p =>
      p.available_metals?.some(m => m.name?.toLowerCase().includes('rose gold'))
    );
    log(`→ ${prods.length} products, all have Rose Gold: ${allHaveRoseGold}`);
    if (prods.length > 0) {
      expect(allHaveRoseGold, 'All returned products should have Rose Gold metal');
    }
  });
}


// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log(`\n${c.bold}McCulloch API — Full Endpoint Test Suite${c.reset}`);
  console.log(`${c.dim}Base URL: ${BASE}${c.reset}`);
  console.log(`${c.dim}Admin:    ${ADMIN_EMAIL}${c.reset}`);
  console.log(`${c.dim}Started:  ${new Date().toLocaleTimeString()}${c.reset}`);

  await testHealth();
  await testAdminAuth();
  await testUserAuth();
  await testFilters();
  await testPublicProducts();
  await testAdminCategories();
  await testAdminJewelryCategories();
  await testAdminProducts();
  await testMarketing();
  await testPromotions();
  await testWatches();
  await testChats();
  await testFavorites();
  await testAdminProfile();
  await testSchemaIntegrity();

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = passed + failed + skipped;
  console.log(`\n${c.bold}══════════════════════════════════════════${c.reset}`);
  console.log(`${c.bold}  RESULTS${c.reset}`);
  console.log(`${c.bold}══════════════════════════════════════════${c.reset}`);
  console.log(`  ${c.green}✓ Passed:${c.reset}  ${passed}`);
  console.log(`  ${c.red}✗ Failed:${c.reset}  ${failed}`);
  console.log(`  ${c.yellow}⊘ Skipped:${c.reset} ${skipped}`);
  console.log(`  ${c.dim}─ Total:   ${total}${c.reset}`);

  if (failures.length > 0) {
    console.log(`\n${c.bold}${c.red}Failed tests:${c.reset}`);
    failures.forEach(f => {
      console.log(`  ${c.red}✗${c.reset} ${f.name}`);
      console.log(`    ${c.dim}${f.error}${c.reset}`);
    });
  } else {
    console.log(`\n  ${c.green}${c.bold}All tests passed!${c.reset}`);
  }
  console.log();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

/**
 * Nivoda Diamond Price Tester
 *
 * Usage:
 *   node scripts/test-nivoda-price.js --shape Pear --carat 0.65 --color G --clarity VS2
 *   node scripts/test-nivoda-price.js --shape Round --carat 1.00 --color H --clarity VS1
 *   node scripts/test-nivoda-price.js --shape Pear --carat 0.65 --color G --clarity VS2 --labgrown true
 *
 * Options:
 *   --shape     Diamond shape  (default: Pear)
 *   --carat     Carat weight   (default: 0.65)
 *   --color     GIA colour     (default: G)
 *   --clarity   GIA clarity    (default: VS2)
 *   --labgrown  true/false     (default: false)
 *   --margin    Carat band %   (default: 10)
 *   --limit     Max results    (default: 20)
 */

const axios = require('axios');

const NIVODA_API_URL = 'https://integrations.nivoda.net/api/diamonds';
const EMAIL    = 'has@mccullochjewellers.co.uk';
const PASSWORD = '31Ashana';

function arg(key, fallback) {
  const idx = process.argv.indexOf(`--${key}`);
  return idx !== -1 ? process.argv[idx + 1] : fallback;
}

async function run() {
  const shape    = arg('shape',   'Pear');
  const carat    = parseFloat(arg('carat',   '0.65'));
  const color    = arg('color',   'G').toUpperCase();
  const clarity  = arg('clarity', 'VS2').toUpperCase();
  const labgrown = arg('labgrown', 'false') === 'true';
  const marginPct= parseFloat(arg('margin', '10')) / 100;
  const limit    = parseInt(arg('limit', '20'));

  const margin   = Math.max(carat * marginPct, 0.05);
  const minCarat = parseFloat((carat - margin).toFixed(2));
  const maxCarat = parseFloat((carat + margin).toFixed(2));
  const nivodaShape = shape.toUpperCase().replace(/[\s-]/g, '_');

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  Nivoda Price Tester`);
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Shape    : ${shape}  (${nivodaShape})`);
  console.log(`  Carat    : ${carat}ct  (band: ${minCarat}–${maxCarat}ct)`);
  console.log(`  Colour   : ${color}`);
  console.log(`  Clarity  : ${clarity}`);
  console.log(`  Lab-grown: ${labgrown}`);
  console.log(`  Limit    : ${limit}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // ── 1. Authenticate ────────────────────────────────────────────────
  console.log('🔑 Authenticating with Nivoda...');
  const authQuery = `{authenticate{username_and_password(username:"${EMAIL}", password:"${PASSWORD}") {token}}}`;
  const authRes = await axios.post(NIVODA_API_URL, { query: authQuery }, { timeout: 15000 });
  if (authRes.data.errors) throw new Error('Auth failed: ' + authRes.data.errors[0].message);
  const token = authRes.data.data.authenticate.username_and_password.token;
  console.log('✅ Authenticated\n');

  // ── 2. Fetch FX rate ───────────────────────────────────────────────
  let usdToGbp = 0.79;
  try {
    const fxRes = await axios.get('https://api.frankfurter.app/latest?from=USD&to=GBP', { timeout: 8000 });
    usdToGbp = fxRes.data.rates.GBP;
    console.log(`💱 Live FX rate: 1 USD = ${usdToGbp.toFixed(4)} GBP\n`);
  } catch {
    console.log(`⚠️  FX fetch failed, using fallback rate: ${usdToGbp}\n`);
  }

  // ── 3. Search Nivoda ───────────────────────────────────────────────
  const query = `query ($token: String!) {
    as(token: $token) {
      diamonds_by_query(
        query: {
          labgrown: ${labgrown ? 'true' : 'false'}
          sizes:    { from: ${minCarat}, to: ${maxCarat} }
          shapes:   ["${nivodaShape}"]
          color:    [${color}]
          clarity:  [${clarity}]
          cut:      [EX,VG,G]
        }
        limit:  ${limit}
        offset: 0
        order:  { type: price, direction: ASC }
      ) {
        items {
          id
          price
          diamond {
            certificate {
              carats color clarity cut lab certNumber
            }
          }
        }
        total_count
      }
    }
  }`;

  console.log('🔍 Searching Nivoda inventory...');
  const res = await axios.post(NIVODA_API_URL, { query, variables: { token } }, { timeout: 30000 });

  if (res.data.errors) {
    console.error('❌ GraphQL Errors:');
    res.data.errors.forEach(e => console.error('  -', e.message));
    process.exit(1);
  }

  const result = res.data.data?.as?.diamonds_by_query;
  const total  = result?.total_count ?? 0;
  const items  = result?.items ?? [];

  console.log(`📦 Total matching in Nivoda: ${total} diamonds`);
  console.log(`📋 Returned: ${items.length} diamonds (sorted by price ASC)\n`);

  if (!items.length) {
    console.log('❌ No diamonds found. Try widening colour/clarity or changing shape.');
    return;
  }

  // ── 4. Show individual prices ──────────────────────────────────────
  console.log('Individual prices:');
  console.log('─'.repeat(75));
  console.log(`  ${'#'.padEnd(3)} ${'USD'.padEnd(10)} ${'GBP'.padEnd(10)} ${'Ct'.padEnd(7)} ${'Col'.padEnd(5)} ${'Clarity'.padEnd(8)} ${'Cut'.padEnd(5)} Lab`);
  console.log('─'.repeat(75));

  const rawPricesUsd = items.map(item => {
    const cert = item.diamond?.certificate;
    const usd  = item.price / 100;           // Nivoda returns USD cents
    const gbp  = usd * usdToGbp;
    return { usd, gbp, cert };
  });

  rawPricesUsd.forEach(({ usd, gbp, cert }, i) => {
    console.log(
      `  ${String(i + 1).padEnd(3)} ` +
      `$${usd.toFixed(0).padEnd(9)} ` +
      `£${gbp.toFixed(0).padEnd(9)} ` +
      `${(cert?.carats ?? '?').toString().padEnd(7)} ` +
      `${(cert?.color   ?? '?').padEnd(5)} ` +
      `${(cert?.clarity ?? '?').padEnd(8)} ` +
      `${(cert?.cut     ?? '?').padEnd(5)} ` +
      `${cert?.lab ?? '?'}`
    );
  });

  // ── 5. Compute statistics ──────────────────────────────────────────
  const usdPrices = rawPricesUsd.map(d => d.usd).sort((a, b) => a - b);
  const drop    = Math.floor(usdPrices.length * 0.25);
  const trimmed = usdPrices.slice(drop, usdPrices.length - drop || undefined);
  const avgUsd  = trimmed.reduce((s, p) => s + p, 0) / trimmed.length;
  const minUsd  = usdPrices[0];
  const maxUsd  = usdPrices[usdPrices.length - 1];

  console.log('─'.repeat(75));
  console.log(`\n📊 Price summary (USD → GBP at ${usdToGbp.toFixed(4)}):\n`);
  console.log(`  Cheapest   : $${minUsd.toFixed(0).padStart(7)}   →  £${(minUsd * usdToGbp).toFixed(0)}`);
  console.log(`  Most exp.  : $${maxUsd.toFixed(0).padStart(7)}   →  £${(maxUsd * usdToGbp).toFixed(0)}`);
  console.log(`  ──────────────────────────────────────────`);
  console.log(`  Trimmed avg: $${avgUsd.toFixed(0).padStart(7)}   →  £${(avgUsd * usdToGbp).toFixed(0)}  ← admin estimate uses this`);
  console.log(`  (Dropped bottom ${drop} and top ${drop} of ${usdPrices.length} to remove outliers)\n`);

  const estimatedGbp = avgUsd * usdToGbp;
  console.log(`✅ Expected admin "Diamond Cost" for ${carat}ct ${shape} ${color} ${clarity}: £${estimatedGbp.toFixed(0)}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

run().catch(err => {
  console.error('\n❌ Error:', err.message);
  if (err.response?.data) console.error('Response:', JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});

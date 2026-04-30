const axios = require('axios');
const cache = require('./cacheService');

const TROY_OZ_TO_GRAMS = 31.1035;
const CACHE_KEY = 'metal:prices:gbp';
const CACHE_TTL = 6 * 60 * 60; // 6 hours — prices shift during trading hours

function parseCsvClose(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) throw new Error('Stooq returned empty CSV');
  const cols = lines[1].split(',');
  const close = parseFloat(cols[6]);
  if (isNaN(close) || close <= 0) throw new Error(`Invalid close price: ${cols[6]}`);
  return close;
}

async function fetchMetalPrices() {
  const cached = await cache.get(CACHE_KEY);
  if (cached) return cached;

  const [goldRes, silverRes, platRes, fxRes] = await Promise.all([
    axios.get('https://stooq.com/q/l/?s=xauusd&f=sd2t2ohlcv&h&e=csv', { timeout: 12000 }),
    axios.get('https://stooq.com/q/l/?s=xagusd&f=sd2t2ohlcv&h&e=csv', { timeout: 12000 }),
    axios.get('https://stooq.com/q/l/?s=xptusd&f=sd2t2ohlcv&h&e=csv', { timeout: 12000 }),
    axios.get('https://api.frankfurter.app/latest?from=USD&to=GBP', { timeout: 12000 }),
  ]);

  const goldUSD    = parseCsvClose(goldRes.data);
  const silverUSD  = parseCsvClose(silverRes.data);
  const platUSD    = parseCsvClose(platRes.data);
  const usdToGbp   = fxRes.data.rates.GBP;

  const toGbpPerGram = (usdPerOz) =>
    parseFloat(((usdPerOz * usdToGbp) / TROY_OZ_TO_GRAMS).toFixed(4));

  const goldGbpPerG = toGbpPerGram(goldUSD);

  const prices = {
    gold_per_gram:       goldGbpPerG,
    silver_per_gram:     toGbpPerGram(silverUSD),
    platinum_per_gram:   toGbpPerGram(platUSD),
    gold_9kt_per_gram:   parseFloat((goldGbpPerG * 9  / 24).toFixed(4)),
    gold_14kt_per_gram:  parseFloat((goldGbpPerG * 14 / 24).toFixed(4)),
    gold_18kt_per_gram:  parseFloat((goldGbpPerG * 18 / 24).toFixed(4)),
    usd_to_gbp:          parseFloat(usdToGbp.toFixed(6)),
    gold_usd_per_oz:     goldUSD,
    silver_usd_per_oz:   silverUSD,
    platinum_usd_per_oz: platUSD,
    fetched_at:          new Date().toISOString(),
    source:              'stooq.com + frankfurter.app',
  };

  await cache.set(CACHE_KEY, prices, CACHE_TTL);
  console.log('✅ Metal prices fetched (GBP/g): gold=£' + goldGbpPerG + ' silver=£' + prices.silver_per_gram + ' platinum=£' + prices.platinum_per_gram);
  return prices;
}

async function clearMetalPriceCache() {
  await cache.del(CACHE_KEY);
}

module.exports = { fetchMetalPrices, clearMetalPriceCache };

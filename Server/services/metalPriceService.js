const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cache = require('./cacheService');

const TROY_OZ_TO_GRAMS = 31.1035;
const CACHE_KEY = 'metal:prices:gbp';
const CACHE_TTL = 6 * 60 * 60; // 6 hours — prices shift during trading hours

// Durable last-known-good store on disk. Survives Redis outages AND process
// restarts, so a transient failure of the external price feeds can never take
// down price recalculation with a 500 again.
const LASTGOOD_FILE = path.join(__dirname, '..', 'data', 'metal-prices-lastgood.json');

function readLastGood() {
  try { return JSON.parse(fs.readFileSync(LASTGOOD_FILE, 'utf8')); } catch { return null; }
}
function writeLastGood(prices) {
  try {
    fs.mkdirSync(path.dirname(LASTGOOD_FILE), { recursive: true });
    fs.writeFileSync(LASTGOOD_FILE, JSON.stringify(prices, null, 2));
  } catch (err) {
    console.warn('⚠️ Could not persist last-known-good metal prices:', err.message);
  }
}

function parseCsvClose(csv) {
  const lines = String(csv).trim().split('\n');
  if (lines.length < 2) throw new Error('Stooq returned empty CSV');
  const cols = lines[1].split(',');
  const close = parseFloat(cols[6]);
  if (isNaN(close) || close <= 0) throw new Error(`Invalid close price: ${cols[6]}`);
  return close;
}

// USD/oz spot from gold-api.com (primary, no key). JSON: { price: <usd/oz> }.
async function fromGoldApi(symbol) {
  const r = await axios.get(`https://api.gold-api.com/price/${symbol}`, { timeout: 12000 });
  const p = parseFloat(r.data?.price);
  if (isNaN(p) || p <= 0) throw new Error(`gold-api ${symbol} invalid price: ${r.data?.price}`);
  return p;
}

// USD/oz spot from stooq.com CSV (secondary fallback).
async function fromStooq(sym) {
  const r = await axios.get(`https://stooq.com/q/l/?s=${sym}&f=sd2t2ohlcv&h&e=csv`, { timeout: 12000 });
  return parseCsvClose(r.data);
}

// Resolve one metal's USD/oz: try primary, then secondary, then last-known-good.
// Only throws if every source fails AND there is no last-known-good value.
async function resolveMetalUsd(goldApiSymbol, stooqSymbol, label, fallback) {
  try { return await fromGoldApi(goldApiSymbol); }
  catch (e1) {
    try { return await fromStooq(stooqSymbol); }
    catch (e2) {
      if (fallback != null) { console.warn(`⚠️ ${label}: both live sources failed (${e1.message}; ${e2.message}) — using last-known-good`); return fallback; }
      throw new Error(`${label}: all price sources failed (${e1.message}; ${e2.message})`);
    }
  }
}

async function fetchLiveMetalPrices(lastGood) {
  const [goldUSD, silverUSD, platUSD, usdToGbp] = await Promise.all([
    resolveMetalUsd('XAU', 'xauusd', 'gold',     lastGood?.gold_usd_per_oz),
    resolveMetalUsd('XAG', 'xagusd', 'silver',   lastGood?.silver_usd_per_oz),
    resolveMetalUsd('XPT', 'xptusd', 'platinum', lastGood?.platinum_usd_per_oz),
    (async () => {
      try {
        const fx = await axios.get('https://api.frankfurter.app/latest?from=USD&to=GBP', { timeout: 12000 });
        const g = fx.data?.rates?.GBP;
        if (!g || isNaN(g) || g <= 0) throw new Error('missing GBP rate');
        return g;
      } catch (err) {
        if (lastGood?.usd_to_gbp != null) { console.warn(`⚠️ fx fetch failed (${err.message}) — using last-known-good`); return lastGood.usd_to_gbp; }
        throw new Error(`fx: ${err.message}`);
      }
    })(),
  ]);

  const toGbpPerGram = (usdPerOz) =>
    parseFloat(((usdPerOz * usdToGbp) / TROY_OZ_TO_GRAMS).toFixed(4));

  const goldGbpPerG = toGbpPerGram(goldUSD);

  return {
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
    source:              'gold-api.com + frankfurter.app',
  };
}

async function fetchMetalPrices() {
  const cached = await cache.get(CACHE_KEY);
  if (cached) return cached;

  const lastGood = readLastGood();

  let prices;
  try {
    prices = await fetchLiveMetalPrices(lastGood);
  } catch (err) {
    // Live feeds failed and no per-source fallback was possible. Fall back to
    // the whole last-known-good payload rather than throwing (which would 500
    // the recalculate endpoint). Only rethrow if we have nothing at all.
    if (lastGood) {
      console.warn(`⚠️ Metal price fetch failed (${err.message}) — serving last-known-good from ${lastGood.fetched_at}`);
      const stale = { ...lastGood, stale: true, source: (lastGood.source || 'unknown') + ' (last-known-good)' };
      await cache.set(CACHE_KEY, stale, CACHE_TTL);
      return stale;
    }
    throw err;
  }

  await cache.set(CACHE_KEY, prices, CACHE_TTL);
  writeLastGood(prices); // durable fallback for the next outage
  console.log('✅ Metal prices fetched (GBP/g): gold=£' + prices.gold_per_gram + ' silver=£' + prices.silver_per_gram + ' platinum=£' + prices.platinum_per_gram);
  return prices;
}

async function clearMetalPriceCache() {
  await cache.del(CACHE_KEY); // clears only the 6h Redis cache; the durable last-known-good file is kept
}

module.exports = { fetchMetalPrices, clearMetalPriceCache };

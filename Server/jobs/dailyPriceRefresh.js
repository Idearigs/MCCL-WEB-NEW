const { getModels } = require('../models');
const ringPricingService = require('../services/ringPricingService');
const metalPriceService = require('../services/metalPriceService');
const { logger } = require('../config/database');

const PREFERRED_METALS = ['gold_18kt', 'gold_18kt_yellow', 'gold_18kt_rose', 'gold_14kt', 'gold_14kt_yellow', 'gold_14kt_rose', 'gold_9kt', 'gold_9kt_yellow', 'gold_9kt_rose', 'platinum', 'silver'];

async function refreshAllRingPrices() {
  const { Product, ProductRingSpecs, ProductSideStones, ProductPricingConfig } = getModels();

  const products = await Product.findAll({
    attributes: ['id', 'nivoda_enabled'],
    include: [
      { model: ProductRingSpecs,    as: 'ringSpecs',    required: true },
      { model: ProductSideStones,   as: 'sideStones',   required: false },
      { model: ProductPricingConfig, as: 'pricingConfig', required: false },
    ],
  });

  // Clear cache so we fetch today's live prices
  await metalPriceService.clearMetalPriceCache();

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const specs = product.ringSpecs;
    const hasWeights = specs.silver_wt || specs.gold_9kt_wt || specs.gold_14kt_wt || specs.gold_18kt_wt || specs.platinum_wt;
    if (!hasWeights) { skipped++; continue; }

    const pricingConfig = product.pricingConfig?.toJSON() || {};
    const sideStones = (product.sideStones || []).map(s => s.toJSON());

    let result;
    try {
      result = await ringPricingService.calculateRingPrice({
        ringSpecs: specs.toJSON(),
        sideStones,
        pricingConfig,
        nivodaDiamondPriceGBP: 0,
      });
    } catch (err) {
      logger.warn(`Price refresh skipped for product ${product.id}: ${err.message}`);
      skipped++;
      continue;
    }

    // Nivoda products: store mount-only price so customer page adds the actual diamond on top.
    // Non-Nivoda products: store total final_price (includes flat-rate diamond estimate).
    const nivodaEnabled = product.nivoda_enabled || false;
    const newOverrides = {};
    for (const key of PREFERRED_METALS) {
      const m = result.prices[key];
      if (m?.available) {
        const priceToStore = nivodaEnabled ? m.mount_only_price : m.final_price;
        if (priceToStore > 0) newOverrides[key] = parseFloat(priceToStore.toFixed(2));
      }
    }

    // Skip update if prices are unchanged (within £0.01)
    const existing = pricingConfig.price_overrides || {};
    const changed = PREFERRED_METALS.some(k => {
      const n = newOverrides[k];
      const o = existing[k] ? parseFloat(existing[k]) : undefined;
      if (n === undefined && o === undefined) return false;
      if (n === undefined || o === undefined) return true;
      return Math.abs(n - o) > 0.01;
    });

    if (!changed) { skipped++; continue; }

    // Save updated calculated_prices and price_overrides
    const configData = {
      calculated_prices: result.prices,
      price_overrides:   newOverrides,
      last_calculated_at: new Date(),
      updated_at:        new Date(),
    };

    if (product.pricingConfig) {
      await product.pricingConfig.update(configData);
    } else {
      await ProductPricingConfig.create({ ...configData, product_id: product.id });
    }

    // Sync best price to products.base_price
    const bestKey = PREFERRED_METALS.find(k => newOverrides[k] > 0);
    if (bestKey) {
      await Product.update(
        { base_price: newOverrides[bestKey], currency: 'GBP', updated_at: new Date() },
        { where: { id: product.id } }
      );
    }

    updated++;
  }

  logger.info(`Daily price refresh: ${updated} updated, ${skipped} unchanged/skipped`);
  return { updated, skipped };
}

function scheduleDailyRefresh() {
  const RUN_HOUR = 2; // 2:00am server time

  function scheduleNext() {
    const now  = new Date();
    const next = new Date();
    next.setHours(RUN_HOUR, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = next - now;

    setTimeout(async () => {
      try {
        logger.info('⏰ Running daily ring price refresh...');
        const r = await refreshAllRingPrices();
        logger.info(`✅ Daily price refresh done — ${r.updated} updated, ${r.skipped} skipped`);
      } catch (err) {
        logger.error('Daily price refresh failed:', err.message);
      }
      scheduleNext();
    }, delay);

    logger.info(`⏰ Next ring price refresh scheduled at ${next.toISOString()}`);
  }

  scheduleNext();
}

// Manual recalculation — same logic as the nightly job but returns a full per-product report.
async function recalculateAllWithReport() {
  const { Product, ProductRingSpecs, ProductSideStones, ProductPricingConfig } = getModels();

  const products = await Product.findAll({
    attributes: ['id', 'name', 'sku', 'slug', 'nivoda_enabled'],
    include: [
      { model: ProductRingSpecs,     as: 'ringSpecs',    required: true  },
      { model: ProductSideStones,    as: 'sideStones',   required: false },
      { model: ProductPricingConfig, as: 'pricingConfig', required: false },
    ],
    order: [['sku', 'ASC']],
  });

  await metalPriceService.clearMetalPriceCache();
  // Never let a metal-price feed hiccup 500 the whole endpoint — the resilient
  // service already falls back to last-known-good, but guard here too so the
  // per-product loop can still run (calculateRingPrice fetches prices itself).
  let metalPrices = null;
  try {
    metalPrices = await metalPriceService.fetchMetalPrices();
  } catch (err) {
    logger.warn(`Recalc: metal price fetch unavailable, proceeding with per-product fallback: ${err.message}`);
  }

  const report  = [];
  let updated   = 0;
  let unchanged = 0;
  let errors    = 0;

  for (const product of products) {
    const entry = {
      product_id: product.id,
      sku:        product.sku  || '—',
      name:       product.name || '—',
      slug:       product.slug || '',
      status:     'skipped',
      reason:     null,
      changes:    {},
    };

    const specs = product.ringSpecs;
    const hasWeights = specs.silver_wt || specs.gold_9kt_wt || specs.gold_14kt_wt || specs.gold_18kt_wt || specs.platinum_wt;
    if (!hasWeights) {
      entry.reason = 'No metal weights configured';
      report.push(entry);
      continue;
    }

    const pricingConfig = product.pricingConfig?.toJSON() || {};
    const sideStones    = (product.sideStones || []).map(s => s.toJSON());
    const oldOverrides  = pricingConfig.price_overrides || {};

    let result;
    try {
      result = await ringPricingService.calculateRingPrice({
        ringSpecs:             specs.toJSON(),
        sideStones,
        pricingConfig,
        nivodaDiamondPriceGBP: 0,
      });
    } catch (err) {
      entry.status = 'error';
      entry.reason = err.message;
      report.push(entry);
      errors++;
      continue;
    }

    const nivodaEnabled = product.nivoda_enabled || false;
    const newOverrides  = {};
    for (const key of PREFERRED_METALS) {
      const m = result.prices[key];
      if (m?.available) {
        const price = nivodaEnabled ? m.mount_only_price : m.final_price;
        if (price > 0) newOverrides[key] = parseFloat(price.toFixed(2));
      }
    }

    // Build per-metal change diff
    const allKeys = new Set([...Object.keys(oldOverrides), ...Object.keys(newOverrides)]);
    let hasChanges = false;
    for (const key of allKeys) {
      const oldVal = oldOverrides[key] != null ? parseFloat(oldOverrides[key]) : null;
      const newVal = newOverrides[key]  != null ? newOverrides[key]            : null;
      const changed = oldVal === null || newVal === null
        ? oldVal !== newVal
        : Math.abs(oldVal - newVal) > 0.01;
      if (changed) {
        entry.changes[key] = { old: oldVal, new: newVal };
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      entry.status = 'unchanged';
      report.push(entry);
      unchanged++;
      continue;
    }

    const configData = {
      calculated_prices:  result.prices,
      price_overrides:    newOverrides,
      last_calculated_at: new Date(),
      updated_at:         new Date(),
    };
    if (product.pricingConfig) {
      await product.pricingConfig.update(configData);
    } else {
      await ProductPricingConfig.create({ ...configData, product_id: product.id });
    }

    const bestKey = PREFERRED_METALS.find(k => newOverrides[k] > 0);
    if (bestKey) {
      await Product.update(
        { base_price: newOverrides[bestKey], currency: 'GBP', updated_at: new Date() },
        { where: { id: product.id } }
      );
    }

    entry.status = 'updated';
    report.push(entry);
    updated++;
  }

  logger.info(`Manual price recalculation: ${updated} updated, ${unchanged} unchanged, ${errors} errors`);
  return { updated, unchanged, errors, total: products.length, metalPrices, report };
}

module.exports = { refreshAllRingPrices, scheduleDailyRefresh, recalculateAllWithReport };

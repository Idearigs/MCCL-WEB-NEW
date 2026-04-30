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

module.exports = { refreshAllRingPrices, scheduleDailyRefresh };

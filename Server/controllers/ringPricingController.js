const { getModels } = require('../models');
const metalPriceService = require('../services/metalPriceService');
const ringPricingService = require('../services/ringPricingService');

function models() {
  const m = getModels();
  return {
    ProductRingSpecs:   m.ProductRingSpecs,
    ProductSideStones:  m.ProductSideStones,
    ProductPricingConfig: m.ProductPricingConfig,
  };
}

// GET /api/ring-pricing/metal-prices
async function getMetalPrices(req, res) {
  try {
    const prices = await metalPriceService.fetchMetalPrices();
    return res.json({ success: true, data: prices });
  } catch (err) {
    console.error('Metal prices error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/ring-pricing/metal-prices/refresh
async function refreshMetalPrices(req, res) {
  try {
    await metalPriceService.clearMetalPriceCache();
    const prices = await metalPriceService.fetchMetalPrices();
    return res.json({ success: true, data: prices, message: 'Metal prices refreshed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/ring-pricing/:productId/specs
async function getRingSpecs(req, res) {
  try {
    const { productId } = req.params;
    const { ProductRingSpecs, ProductSideStones, ProductPricingConfig } = models();

    const [specs, sideStones, pricingConfig] = await Promise.all([
      ProductRingSpecs.findOne({ where: { product_id: productId } }),
      ProductSideStones.findAll({ where: { product_id: productId }, order: [['sort_order', 'ASC']] }),
      ProductPricingConfig.findOne({ where: { product_id: productId } }),
    ]);

    return res.json({
      success: true,
      data: {
        specs:          specs     ? specs.toJSON()          : null,
        side_stones:    sideStones.map(s => s.toJSON()),
        pricing_config: pricingConfig ? pricingConfig.toJSON() : null,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/ring-pricing/:productId/specs
async function saveRingSpecs(req, res) {
  try {
    const { productId } = req.params;
    const { specs, side_stones, pricing_config } = req.body;
    const { ProductRingSpecs, ProductSideStones, ProductPricingConfig } = models();

    if (specs) {
      const existingSpecs = await ProductRingSpecs.findOne({ where: { product_id: productId } });
      if (existingSpecs) {
        await existingSpecs.update({ ...specs, updated_at: new Date() });
      } else {
        await ProductRingSpecs.create({ ...specs, product_id: productId });
      }
    }

    if (Array.isArray(side_stones)) {
      await ProductSideStones.destroy({ where: { product_id: productId } });
      if (side_stones.length > 0) {
        await ProductSideStones.bulkCreate(
          side_stones.map((s, i) => ({
            ...s,
            product_id: productId,
            sort_order: i,
            created_at: new Date(),
            updated_at: new Date(),
          }))
        );
      }
    }

    if (pricing_config) {
      const existingConfig = await ProductPricingConfig.findOne({ where: { product_id: productId } });
      if (existingConfig) {
        await existingConfig.update({ ...pricing_config, updated_at: new Date() });
      } else {
        await ProductPricingConfig.create({ ...pricing_config, product_id: productId });
      }

      // Sync best price from price_overrides back to products table
      const overrides = pricing_config.price_overrides;
      if (overrides && typeof overrides === 'object') {
        const preferred = ['gold_18kt', 'gold_18kt_yellow', 'gold_18kt_rose', 'gold_14kt', 'gold_14kt_yellow', 'gold_14kt_rose', 'gold_9kt', 'gold_9kt_yellow', 'gold_9kt_rose', 'platinum', 'silver'];
        const bestKey = preferred.find(k => overrides[k] && parseFloat(overrides[k]) > 0);
        if (bestKey) {
          const { Product } = getModels();
          await Product.update(
            { base_price: parseFloat(overrides[bestKey]), currency: 'GBP', updated_at: new Date() },
            { where: { id: productId } }
          );
        }
      }
    }

    return res.json({ success: true, message: 'Ring specs saved' });
  } catch (err) {
    console.error('Save ring specs error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/ring-pricing/:productId/calculate
async function calculatePrice(req, res) {
  try {
    const { productId } = req.params;
    const { nivodaDiamondPriceGBP } = req.body;
    const { ProductRingSpecs, ProductSideStones, ProductPricingConfig } = models();

    const [specs, sideStones, pricingConfig] = await Promise.all([
      ProductRingSpecs.findOne({ where: { product_id: productId } }),
      ProductSideStones.findAll({ where: { product_id: productId }, order: [['sort_order', 'ASC']] }),
      ProductPricingConfig.findOne({ where: { product_id: productId } }),
    ]);

    if (!specs) {
      return res.status(404).json({ success: false, error: 'No ring specs found — add metal weights first' });
    }

    const result = await ringPricingService.calculateRingPrice({
      ringSpecs:             specs.toJSON(),
      sideStones:            sideStones.map(s => s.toJSON()),
      pricingConfig:         pricingConfig ? pricingConfig.toJSON() : {},
      nivodaDiamondPriceGBP: nivodaDiamondPriceGBP ? parseFloat(nivodaDiamondPriceGBP) : 0,
    });

    // For Nivoda-enabled products: store mount-only price so customer page adds their own
    // diamond price on top (no double-counting). For non-Nivoda: store full final_price.
    const { Product } = getModels();
    const productRow = await Product.findByPk(productId, { attributes: ['id', 'nivoda_enabled'] });
    const nivodaEnabled = productRow?.nivoda_enabled || false;

    const PREFERRED_METALS = ['gold_18kt', 'gold_18kt_yellow', 'gold_18kt_rose', 'gold_14kt', 'gold_14kt_yellow', 'gold_14kt_rose', 'gold_9kt', 'gold_9kt_yellow', 'gold_9kt_rose', 'platinum', 'silver'];
    const newOverrides = {};
    for (const key of PREFERRED_METALS) {
      const m = result.prices[key];
      if (m?.available) {
        const priceToStore = nivodaEnabled ? m.mount_only_price : m.final_price;
        if (priceToStore > 0) newOverrides[key] = parseFloat(priceToStore.toFixed(2));
      }
    }

    // Persist calculated prices and price_overrides so the customer sees per-metal pricing immediately
    const existingConfig2 = await ProductPricingConfig.findOne({ where: { product_id: productId } });
    const configData = {
      metal_premium_pct:      pricingConfig?.metal_premium_pct      ?? 5,
      side_stone_rate_per_ct: pricingConfig?.side_stone_rate_per_ct ?? 500,
      diamond_rate_per_ct:    pricingConfig?.diamond_rate_per_ct    ?? 2000,
      margin_type:            pricingConfig?.margin_type             ?? 'percent',
      margin_value:           pricingConfig?.margin_value            ?? 0,
      calculated_prices:      result.prices,
      price_overrides:        newOverrides,
      last_calculated_at:     new Date(),
      updated_at:             new Date(),
    };
    if (existingConfig2) {
      await existingConfig2.update(configData);
    } else {
      await ProductPricingConfig.create({ ...configData, product_id: productId });
    }

    // Sync best metal price to products.base_price
    const bestKey = PREFERRED_METALS.find(k => newOverrides[k] && newOverrides[k] > 0);
    if (bestKey) {
      await Product.update(
        { base_price: newOverrides[bestKey], currency: 'GBP', updated_at: new Date() },
        { where: { id: productId } }
      );
    }

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('Calculate price error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/ring-pricing/refresh-all-prices
async function refreshAllProductPrices(req, res) {
  try {
    const { refreshAllRingPrices } = require('../jobs/dailyPriceRefresh');
    const result = await refreshAllRingPrices();
    return res.json({ success: true, data: result, message: `${result.updated} products updated, ${result.skipped} unchanged` });
  } catch (err) {
    console.error('Refresh all prices error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/ring-pricing/preview — calculate without a saved product (create-mode preview)
async function previewPrice(req, res) {
  try {
    const { specs = {}, side_stones = [], pricing_config = {}, nivodaDiamondPriceGBP = 0 } = req.body;
    const result = await ringPricingService.calculateRingPrice({
      ringSpecs:             specs,
      sideStones:            side_stones,
      pricingConfig:         pricing_config,
      nivodaDiamondPriceGBP: nivodaDiamondPriceGBP ? parseFloat(nivodaDiamondPriceGBP) : 0,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('Preview price error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { getMetalPrices, refreshMetalPrices, getRingSpecs, saveRingSpecs, calculatePrice, previewPrice, refreshAllProductPrices };

/**
 * Diamond pricing service
 * -----------------------
 * Single source of truth for turning a set of centre-diamond specs
 * (carat / clarity / colour / cut / shape / stone type / certificate) into a
 * GBP price, applying the owner's tiered markup.
 *
 * Used by:
 *   - nivodaController.getDiamondPriceBySuggestions  → the price shown on the PDP
 *   - stripeController.computeServerFloor            → the authoritative payment
 *     floor, so a tampered checkout amount can't underpay the centre stone.
 *
 * McCulloch sources the stone to spec, so the cascade always yields a price:
 *   exact spec → broaden refinements → widen carat → model estimate → pure model.
 */

const nivodaService = require('./nivodaService');
const { summarisePrices } = require('./pricingService');
const metalPriceService = require('./metalPriceService');
const { diamondFloorGBP } = require('./engagementFloor');
const { applyMarkupGbp } = require('./diamondMarkup');

const CLARITY_MULT = { FL: 1.36, IF: 1.24, VVS1: 1.15, VVS2: 1.08, VS1: 1.05, VS2: 1.00, SI1: 0.90, SI2: 0.82, I1: 0.70, I2: 0.62 };
const COLOUR_MULT  = { D: 1.12, E: 1.08, F: 1.05, G: 1.00, H: 0.95, I: 0.90, J: 0.85, K: 0.80 };

/**
 * @param {object} specs { carat, clarity, color, cut, certificate, stoneType, shape, polish, symmetry, fluorescence }
 * @returns {Promise<{min:number, avg:number, max:number, count:number, estimated:boolean, priceBasis:string}>}
 *          Prices are GBP, markup already applied. `min` is the conservative figure
 *          to use for a payment floor. Returns zeros only if every stage fails.
 */
async function estimateDiamondPriceGBP(specs = {}) {
  const { carat, clarity, color, cut, certificate, stoneType, shape, polish, symmetry, fluorescence } = specs;

  const labgrown = stoneType === 'lab-grown';
  const shapeNivoda = shape ? shape.toUpperCase().replace(/[\s-]/g, '_') : undefined;
  const ct = parseFloat(carat) || 1.0;

  const metalPrices = await metalPriceService.fetchMetalPrices();
  const usdToGbp = metalPrices.usd_to_gbp || 0.79;

  // Run one Nivoda search with the given filter overrides, apply the client-side cert
  // filter, and return the summarised GBP prices (or null when nothing matched).
  const priceFor = async (overrides, applyCert) => {
    const filters = {
      minCarat: ct, maxCarat: parseFloat((ct * 1.10).toFixed(2)),
      minPrice: 0, maxPrice: 500000, labgrown, shape: shapeNivoda, limit: 10,
      ...overrides,
    };
    const diamonds = await nivodaService.searchDiamonds(filters);
    let items = diamonds.items || [];
    if (applyCert && certificate) {
      const certList = certificate.split(',').map(c => c.trim().toUpperCase());
      items = items.filter(d => certList.includes(d.diamond?.certificate?.lab?.toUpperCase()));
    }
    if (!items.length) return null;
    // Apply the owner's tiered markup to each stone's BASE price (Nivoda markup_price
    // comes back == price for this account, so we add the only markup here).
    return { ...summarisePrices(items, usdToGbp, (base) => applyMarkupGbp(base, labgrown)), items };
  };

  let result = null, estimated = false, note = 'exact';

  // 1) Exact spec (all refinements + certificate).
  result = await priceFor({
    clarity: clarity ? [clarity] : undefined, color: color ? [color] : undefined,
    cut: cut ? cut.split(',') : undefined,
    polish: polish ? polish.split(',') : undefined,
    symmetry: symmetry ? symmetry.split(',') : undefined,
    fluorescence: fluorescence ? fluorescence.split(',') : undefined,
    labs: certificate ? certificate.split(',') : undefined,
  }, true);

  // 2) Broaden: keep carat/clarity/colour/shape/type, drop cut/polish/symmetry/fluor/cert.
  if (!result) { note = 'broadened'; result = await priceFor({ clarity: clarity ? [clarity] : undefined, color: color ? [color] : undefined }, false); }

  // 3) Widen the carat band a little (stones just off the target size), still exact clarity/colour.
  if (!result) {
    note = 'estimated'; estimated = true;
    result = await priceFor({ clarity: clarity ? [clarity] : undefined, color: color ? [color] : undefined, minCarat: parseFloat((ct * 0.85).toFixed(2)), maxCarat: parseFloat((ct * 1.30).toFixed(2)) }, false);
  }

  // 4) Model estimate: any clarity/colour at ~this carat/shape/type, scaled to the target
  //    clarity & colour via the premium multipliers. Purely indicative.
  if (!result) {
    note = 'estimated'; estimated = true;
    const anyStock = await priceFor({ minCarat: parseFloat((ct * 0.85).toFixed(2)), maxCarat: parseFloat((ct * 1.30).toFixed(2)) }, false);
    if (anyStock) {
      const k = (CLARITY_MULT[clarity] ?? 1) * (COLOUR_MULT[color] ?? 1);
      result = { min: Math.round(anyStock.min * k), avg: Math.round(anyStock.avg * k), max: Math.round(anyStock.max * k), items: [] };
    }
  }

  // 5) Pure model estimate (no live stock at all for this shape/size):
  //    anchor to the marked-up 0.5ct G/VS2 diamond floor for the shape, scale by carat
  //    (price rises ~carat^1.9) and the clarity/colour multipliers. Always yields a price.
  if (!result) {
    note = 'estimated'; estimated = true;
    const shapeBase = diamondFloorGBP(shape);
    const caratFactor = Math.pow((ct || 0.5) / 0.5, 1.9);
    const baseEst = shapeBase * caratFactor * (CLARITY_MULT[clarity] ?? 1) * (COLOUR_MULT[color] ?? 1) * (labgrown ? 0.35 : 1);
    const est = applyMarkupGbp(baseEst, labgrown);
    result = { min: Math.round(est * 0.9), avg: Math.round(est), max: Math.round(est * 1.15), items: [] };
  }

  if (!result) return { min: 0, avg: 0, max: 0, count: 0, estimated: false, priceBasis: 'none' };

  return {
    min: result.min, avg: result.avg, max: result.max,
    count: (result.items || []).length,
    items: result.items || [],
    estimated, priceBasis: note,
  };
}

module.exports = { estimateDiamondPriceGBP, CLARITY_MULT, COLOUR_MULT };

/**
 * Engagement "from" price floor.
 *
 * Nivoda-enabled engagement rings store a MOUNT-ONLY price in price_overrides
 * (the customer page adds the live diamond on top). Listing/home cards show
 * products.base_price, so if we sync base_price to the bare mount the cards read
 * ~£200–600 and look far too cheap. To give a realistic ">£1,000 from" price we
 * add a per-shape diamond floor (≈ a 1ct G/VS2 stone) to the mount when syncing
 * base_price. The PDP still shows exact live pricing for the chosen spec.
 *
 * Values are anchored to real Nivoda 1ct G/VS2 averages by shape, with low-stock
 * outliers curated and a >=820 minimum so every combination clears £1,000.
 */

const SHAPE_DIAMOND_FLOOR = {
  Round: 890,
  Oval: 980,
  Emerald: 820,
  Pear: 970,
  Princess: 820,
  Heart: 820,
  Marquise: 950,
  Cushion: 880,
  Baguette: 860,
  Trillion: 880,
  Radiant: 840,
};
const DEFAULT_FLOOR = 860;

function diamondFloorGBP(stoneShape) {
  if (!stoneShape) return DEFAULT_FLOOR;
  return SHAPE_DIAMOND_FLOOR[stoneShape] != null ? SHAPE_DIAMOND_FLOOR[stoneShape] : DEFAULT_FLOOR;
}

/**
 * Compute the base_price to store on the products table.
 * @param {number} mountPrice  chosen metal mount (from price_overrides)
 * @param {boolean} nivodaEnabled  true for engagement rings that add a live diamond
 * @param {string} stoneShape  centre-stone shape (product_ring_specs.stone_shape)
 */
function displayBasePrice(mountPrice, nivodaEnabled, stoneShape) {
  const m = parseFloat(mountPrice) || 0;
  if (!nivodaEnabled) return m; // non-Nivoda prices already include a diamond estimate
  return Math.round(m + diamondFloorGBP(stoneShape));
}

module.exports = { diamondFloorGBP, displayBasePrice };

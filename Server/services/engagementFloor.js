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

// Marked-up (retail) 1ct G/VS2 diamond price per shape, in GBP — measured from
// Nivoda's markup_price for the 1.00–1.10ct band. These are the diamond component
// of the card "from" price so it aligns with the PDP (mount + live marked-up stone).
const SHAPE_DIAMOND_FLOOR = {
  Round: 3520,
  Oval: 3060,
  Emerald: 3820,
  Pear: 3170,
  Princess: 3170,
  Heart: 3530,
  Marquise: 4510,
  Cushion: 3890,
  Baguette: 4410,
  Trillion: 3500,
  Radiant: 3160,
  Asscher: 3650,
};
const DEFAULT_FLOOR = 3500;

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

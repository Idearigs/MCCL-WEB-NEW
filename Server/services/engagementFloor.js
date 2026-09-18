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

// Marked-up (retail) 0.5ct G/VS2 diamond price per shape, in GBP — measured from
// Nivoda's markup_price for the 0.50ct band. These are the diamond component of the
// card "from" price so it aligns with the PDP default (mount + live marked-up 0.5ct
// stone). The default carat is 0.50, so the "from" price reads ~£1,500–2,000; the PDP
// still shows exact live pricing as the customer sizes the stone up. (Cushion/Trillion
// have thin 0.5ct stock, so they are estimated at ~0.28× their 1ct value; Baguette's
// 0.5ct average is a low-stock outlier and is curated to the shape family.)
const SHAPE_DIAMOND_FLOOR = {
  Round: 980,
  Oval: 900,
  Emerald: 960,
  Pear: 880,
  Princess: 980,
  Heart: 925,
  Marquise: 1125,
  Cushion: 1090,
  Baguette: 1240,
  Trillion: 980,
  Radiant: 965,
  Asscher: 1080,
};
const DEFAULT_FLOOR = 950;

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

/**
 * Order utilities for generating unique order IDs and handling order logic
 */

/**
 * Generates a unique order number based on product type
 * Format:
 *   - Jewelry orders: JWL-YYYYMMDD-XXXXX
 *   - Watch orders: WTC-YYYYMMDD-XXXXX
 *   - Mixed orders: MXD-YYYYMMDD-XXXXX
 *
 * @param {Array} cartItems - Array of cart items with product_type property
 * @returns {string} Unique order number
 */
function generateOrderNumber(cartItems) {
  // Determine order type based on cart items
  let hasJewelry = false;
  let hasWatches = false;

  for (const item of cartItems) {
    if (item.type === 'jewelry') {
      hasJewelry = true;
    } else if (item.type === 'watch') {
      hasWatches = true;
    }
  }

  // Determine prefix based on product types
  let prefix;
  if (hasJewelry && hasWatches) {
    prefix = 'MXD'; // Mixed order
  } else if (hasJewelry) {
    prefix = 'JWL'; // Jewelry order
  } else if (hasWatches) {
    prefix = 'WTC'; // Watch order
  } else {
    prefix = 'MCL'; // Default/General order
  }

  // Generate timestamp part: YYYYMMDD
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Generate random number: XXXXX (5 digits)
  const randomNum = String(Math.floor(Math.random() * 100000)).padStart(5, '0');

  // Combine into final order number
  return `${prefix}-${dateStr}-${randomNum}`;
}

/**
 * Gets the order type from cart items
 * @param {Array} cartItems - Array of cart items
 * @returns {string} 'jewelry', 'watch', 'mixed', or 'unknown'
 */
function getOrderType(cartItems) {
  let hasJewelry = false;
  let hasWatches = false;

  for (const item of cartItems) {
    if (item.type === 'jewelry') {
      hasJewelry = true;
    } else if (item.type === 'watch') {
      hasWatches = true;
    }
  }

  if (hasJewelry && hasWatches) {
    return 'mixed';
  } else if (hasJewelry) {
    return 'jewelry';
  } else if (hasWatches) {
    return 'watch';
  }
  return 'unknown';
}

module.exports = {
  generateOrderNumber,
  getOrderType
};

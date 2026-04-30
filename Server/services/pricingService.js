const FALLBACK_USD_TO_GBP = 0.79;

/** Convert Nivoda USD cents → GBP pounds using live exchange rate */
const centsToGBP = (cents, usdToGbp = FALLBACK_USD_TO_GBP) =>
  Math.round((cents / 100) * usdToGbp);

/** Summarise an array of Nivoda items into { min, avg, max } in GBP */
const summarisePrices = (items = [], usdToGbp = FALLBACK_USD_TO_GBP) => {
  const prices = items.map(d => centsToGBP(d.price, usdToGbp));
  if (!prices.length) return { min: 0, avg: 0, max: 0 };
  return {
    min: Math.min(...prices),
    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    max: Math.max(...prices),
  };
};

/** Apply a metal's price_multiplier to a base price */
const applyMetalMultiplier = (basePrice, multiplier = 1) =>
  Math.round(parseFloat(basePrice) * parseFloat(multiplier) * 100) / 100;

module.exports = { centsToGBP, summarisePrices, applyMetalMultiplier };

const USD_TO_GBP = 0.79;

/** Convert Nivoda USD cents → GBP pounds */
const centsToGBP = (cents) => Math.round((cents / 100) * USD_TO_GBP);

/** Summarise an array of Nivoda items into { min, avg, max } in GBP */
const summarisePrices = (items = []) => {
  const prices = items.map(d => centsToGBP(d.price));
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

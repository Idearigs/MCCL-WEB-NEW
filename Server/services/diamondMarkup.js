/**
 * Owner diamond markup tiers (McCulloch), applied to the Nivoda BASE price.
 *
 * The site fetches Nivoda `price`/`markup_price`; in this account those come back equal
 * (the Feeds-Hub markup is not reflected on the GraphQL API), so we apply the owner's
 * tiered markup here to guarantee margin on every diamond. Bands are on the BASE (cost)
 * value in GBP; sale = base × (1 + markup%). From-inclusive, To-exclusive.
 *
 * Source: owner's Nivoda markup tables (natural + lab-grown), 2026-09.
 */

// [fromGbp, toGbp, markupPct]
const NATURAL = [
  [0, 260, 220], [260, 650, 220], [650, 1300, 220],
  [1300, 2600, 100], [2600, 3900, 45], [3900, 6500, 35],
  [6500, 9100, 30], [9100, 13000, 25], [13000, 65000, 25],
  [65000, 130000, 18], [130000, Infinity, 12],
];

// Lab table has overlaps/gaps in the source; 5000–9999 filled at 50% pending owner confirm.
const LAB = [
  [0, 301, 500], [301, 501, 400], [501, 1000, 300],
  [1000, 2000, 300], [2000, 3000, 120], [3000, 5000, 75],
  [5000, 10000, 50], [10000, 15001, 50], [15001, 30001, 50],
  [30001, Infinity, 25],
];

function markupPct(baseGbp, isLab) {
  const tiers = isLab ? LAB : NATURAL;
  const b = Number(baseGbp) || 0;
  for (const [from, to, pct] of tiers) if (b >= from && b < to) return pct;
  return tiers[tiers.length - 1][2];
}

/** Multiplier to turn a base (cost) GBP price into the retail price. */
function markupMultiplier(baseGbp, isLab = false) {
  return 1 + markupPct(baseGbp, isLab) / 100;
}

/** Apply the markup to a base GBP price → retail GBP price. */
function applyMarkupGbp(baseGbp, isLab = false) {
  return Math.round(baseGbp * markupMultiplier(baseGbp, isLab));
}

module.exports = { markupPct, markupMultiplier, applyMarkupGbp, NATURAL, LAB };

const metalPriceService = require('./metalPriceService');

const METALS = [
  { key: 'silver',    label: 'Silver',      weightField: 'silver_wt',    priceField: 'silver_per_gram'    },
  { key: 'gold_9kt',  label: '9kt Gold',    weightField: 'gold_9kt_wt',  priceField: 'gold_9kt_per_gram'  },
  { key: 'gold_14kt', label: '14kt Gold',   weightField: 'gold_14kt_wt', priceField: 'gold_14kt_per_gram' },
  { key: 'gold_18kt', label: '18kt Gold',   weightField: 'gold_18kt_wt', priceField: 'gold_18kt_per_gram' },
  { key: 'platinum',  label: 'Platinum',    weightField: 'platinum_wt',  priceField: 'platinum_per_gram'  },
];

async function calculateRingPrice({ ringSpecs, sideStones = [], pricingConfig = {}, nivodaDiamondPriceGBP = 0 }) {
  const metalPrices     = await metalPriceService.fetchMetalPrices();
  const premiumMult     = 1 + (parseFloat(pricingConfig.metal_premium_pct ?? 5) / 100);
  const sideStoneRate   = parseFloat(pricingConfig.side_stone_rate_per_ct ?? 500);
  const marginType      = pricingConfig.margin_type  || 'percent';
  const marginValue     = parseFloat(pricingConfig.margin_value ?? 0);

  const totalSideStoneCt = sideStones.reduce((sum, s) => sum + (parseFloat(s.carats) || 0), 0);
  const sideStoneCost    = parseFloat((totalSideStoneCt * sideStoneRate).toFixed(2));
  const diamondCost      = parseFloat((nivodaDiamondPriceGBP || 0).toFixed(2));

  const result = {};

  for (const metal of METALS) {
    const weight = parseFloat(ringSpecs[metal.weightField]);
    if (!weight || isNaN(weight)) {
      result[metal.key] = { available: false, reason: 'No weight data', label: metal.label };
      continue;
    }

    const spotPerGram = metalPrices[metal.priceField];
    const mountCost   = parseFloat((weight * spotPerGram * premiumMult).toFixed(2));
    const totalCost   = parseFloat((mountCost + diamondCost + sideStoneCost).toFixed(2));
    const finalPrice  = parseFloat((
      marginType === 'percent'
        ? totalCost * (1 + marginValue / 100)
        : totalCost + marginValue
    ).toFixed(2));

    result[metal.key] = {
      available:         true,
      label:             metal.label,
      weight_g:          weight,
      spot_per_gram:     spotPerGram,
      mount_cost:        mountCost,
      diamond_cost:      diamondCost,
      side_stones_cost:  sideStoneCost,
      total_cost:        totalCost,
      margin_applied:    marginType === 'percent' ? `${marginValue}%` : `£${marginValue}`,
      final_price:       finalPrice,
    };
  }

  return {
    prices: result,
    meta: {
      metal_prices_snapshot: metalPrices,
      side_stones_total_ct:  parseFloat(totalSideStoneCt.toFixed(4)),
      side_stone_rate_per_ct: sideStoneRate,
      diamond_cost:          diamondCost,
      calculated_at:         new Date().toISOString(),
    },
  };
}

module.exports = { calculateRingPrice, METALS };

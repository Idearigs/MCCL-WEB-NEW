const metalPriceService = require('./metalPriceService');
const nivodaService     = require('./nivodaService');

const METALS = [
  { key: 'silver',          label: 'Silver',          weightField: 'silver_wt',    priceField: 'silver_per_gram'    },
  { key: 'gold_9kt',        label: '9kt White Gold',  weightField: 'gold_9kt_wt',  priceField: 'gold_9kt_per_gram'  },
  { key: 'gold_9kt_yellow', label: '9kt Yellow Gold', weightField: 'gold_9kt_wt',  priceField: 'gold_9kt_per_gram'  },
  { key: 'gold_9kt_rose',   label: '9kt Rose Gold',   weightField: 'gold_9kt_wt',  priceField: 'gold_9kt_per_gram'  },
  { key: 'gold_14kt',        label: '14kt White Gold', weightField: 'gold_14kt_wt', priceField: 'gold_14kt_per_gram' },
  { key: 'gold_14kt_yellow', label: '14kt Yellow Gold',weightField: 'gold_14kt_wt', priceField: 'gold_14kt_per_gram' },
  { key: 'gold_14kt_rose',   label: '14kt Rose Gold',  weightField: 'gold_14kt_wt', priceField: 'gold_14kt_per_gram' },
  { key: 'gold_18kt',        label: '18kt White Gold', weightField: 'gold_18kt_wt', priceField: 'gold_18kt_per_gram' },
  { key: 'gold_18kt_yellow', label: '18kt Yellow Gold',weightField: 'gold_18kt_wt', priceField: 'gold_18kt_per_gram' },
  { key: 'gold_18kt_rose',   label: '18kt Rose Gold',  weightField: 'gold_18kt_wt', priceField: 'gold_18kt_per_gram' },
  { key: 'platinum',         label: 'Platinum',        weightField: 'platinum_wt',  priceField: 'platinum_per_gram'  },
];

const MOUNT_SURCHARGE = 1.022; // 2.2% surcharge applied to all metal mount costs

async function calculateRingPrice({ ringSpecs, sideStones = [], pricingConfig = {}, nivodaDiamondPriceGBP = 0 }) {
  const metalPrices     = await metalPriceService.fetchMetalPrices();
  const premiumMult     = 1 + (parseFloat(pricingConfig.metal_premium_pct ?? 5) / 100);
  const sideStoneRate   = parseFloat(pricingConfig.side_stone_rate_per_ct ?? 500);
  const diamondRate     = parseFloat(pricingConfig.diamond_rate_per_ct ?? 2000);
  const marginType      = pricingConfig.margin_type  || 'percent';
  const marginValue     = parseFloat(pricingConfig.margin_value ?? 0);

  // Only price rows where ALL 4 fields are complete (shape, dimensions, pieces, carats)
  const completeSideStones = sideStones.filter(s =>
    s.shape && s.dimensions && parseFloat(s.carats) > 0 && parseFloat(s.pieces) > 0
  );
  const totalSideStoneCt = completeSideStones.reduce((sum, s) => sum + (parseFloat(s.carats) || 0), 0);
  const sideStoneCost    = parseFloat((totalSideStoneCt * sideStoneRate).toFixed(2));

  // Nivoda returns prices in USD — convert to GBP using live exchange rate
  const usdToGbp = parseFloat(metalPrices.usd_to_gbp) || 0.79;

  // Diamond cost: use Nivoda price if provided, else try Nivoda lookup by shape+carat, else flat rate
  const centerStoneCt = (parseFloat(ringSpecs.cs1_carats) || 0) + (parseFloat(ringSpecs.cs2_carats) || 0);
  let diamondCost;
  if (nivodaDiamondPriceGBP > 0) {
    diamondCost = parseFloat(nivodaDiamondPriceGBP.toFixed(2));
  } else if (centerStoneCt > 0 && ringSpecs.cs1_shape) {
    const labgrown = (ringSpecs.stone_type || '').toLowerCase().includes('lab');
    const nivodaUsdEstimate = await nivodaService.estimateDiamondPrice(
      ringSpecs.cs1_shape, ringSpecs.cs1_carats, labgrown
    );
    diamondCost = nivodaUsdEstimate !== null
      ? parseFloat((nivodaUsdEstimate * usdToGbp).toFixed(2))
      : parseFloat((centerStoneCt * diamondRate).toFixed(2));
  } else {
    diamondCost = parseFloat((centerStoneCt * diamondRate).toFixed(2));
  }

  const result = {};

  for (const metal of METALS) {
    const weight = parseFloat(ringSpecs[metal.weightField]);
    if (!weight || isNaN(weight)) {
      result[metal.key] = { available: false, reason: 'No weight data', label: metal.label };
      continue;
    }

    const spotPerGram = metalPrices[metal.priceField];
    const mountCost   = parseFloat((weight * spotPerGram * premiumMult * MOUNT_SURCHARGE).toFixed(2));
    const totalCost   = parseFloat((mountCost + diamondCost + sideStoneCost).toFixed(2));
    const finalPrice  = parseFloat((
      marginType === 'percent'
        ? totalCost * (1 + marginValue / 100)
        : totalCost + marginValue
    ).toFixed(2));

    // mount_only_final_price: ring cost without the center diamond (used by customer page for Nivoda products)
    const mountOnlyFinalPrice = parseFloat((
      marginType === 'percent'
        ? (mountCost + sideStoneCost) * (1 + marginValue / 100)
        : (mountCost + sideStoneCost) + marginValue
    ).toFixed(2));

    result[metal.key] = {
      available:            true,
      label:                metal.label,
      weight_g:             weight,
      spot_per_gram:        spotPerGram,
      mount_cost:           mountCost,
      diamond_cost:         diamondCost,
      side_stones_cost:     sideStoneCost,
      total_cost:           totalCost,
      margin_applied:       marginType === 'percent' ? `${marginValue}%` : `£${marginValue}`,
      final_price:          finalPrice,
      mount_only_price:     mountOnlyFinalPrice,
    };
  }

  return {
    prices: result,
    meta: {
      metal_prices_snapshot:  metalPrices,
      side_stones_total_ct:   parseFloat(totalSideStoneCt.toFixed(4)),
      complete_side_stones:   completeSideStones.length,
      side_stone_rate_per_ct: sideStoneRate,
      diamond_cost:           diamondCost,
      diamond_source:         nivodaDiamondPriceGBP > 0 ? 'nivoda_selected' : (ringSpecs.cs1_shape && centerStoneCt > 0 ? 'nivoda_estimate' : 'flat_rate'),
      calculated_at:          new Date().toISOString(),
    },
  };
}

module.exports = { calculateRingPrice, METALS };

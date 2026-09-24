/**
 * Nivoda API Controller
 * Handles all Nivoda API related endpoints
 */

const nivodaService = require('../services/nivodaService');
const { centsToGBP, summarisePrices } = require('../services/pricingService');
const metalPriceService = require('../services/metalPriceService');
const { diamondFloorGBP } = require('../services/engagementFloor');
const { applyMarkupGbp } = require('../services/diamondMarkup');

/**
 * Get available Nivoda diamond options
 * Returns available carat weights, clarities, colors, cuts based on Nivoda API documentation
 * Note: The Nivoda API doesn't return spec values in the response, so we use documented filter values
 */
function getAvailableOptions(req, res) {
  const availableOptions = {
    carats: ['0.5', '0.75', '1.0', '1.25', '1.5', '1.75', '2.0', '2.5', '3.0', '5.0', '10.0'],
    clarities: ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'],
    colours: ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'],
    cuts: ['EX', 'VG', 'G', 'F', 'P'],
    stoneTypes: ['Natural', 'Lab-Grown'],
    certificates: ['GIA', 'IGI', 'HRD', 'GCAL', 'EGL', 'DBIOD', 'GSI', 'SGL', 'AGS', 'EGLISR'],
    polishes: ['EX', 'VG', 'G', 'F', 'P'],
    symmetries: ['EX', 'VG', 'G', 'F', 'P'],
    fluorescences: ['NONE', 'FAINT', 'MEDIUM', 'STRONG', 'VERY_STRONG'],
  };

  return res.json({
    success: true,
    data: availableOptions,
    message: 'Available Nivoda diamond options (based on GIA documentation)',
    source: 'nivoda_documentation'
  });
}

/**
 * Search diamonds from Nivoda API
 * Query params: minCarat, maxCarat, minPrice, maxPrice, color, clarity, cut, certificate, limit, offset
 */
async function searchDiamonds(req, res) {
  try {
    // Build filters from query params
    const filters = {
      minCarat:     parseFloat(req.query.minCarat) || 0.5,
      maxCarat:     parseFloat(req.query.maxCarat) || 10,
      minPrice:     parseFloat(req.query.minPrice) || 0,
      maxPrice:     parseFloat(req.query.maxPrice) || 500000,
      color:        req.query.color        ? req.query.color.split(',')        : undefined,
      clarity:      req.query.clarity      ? req.query.clarity.split(',')      : undefined,
      cut:          req.query.cut          ? req.query.cut.split(',')          : undefined,
      polish:       req.query.polish       ? req.query.polish.split(',')       : undefined,
      symmetry:     req.query.symmetry     ? req.query.symmetry.split(',')     : undefined,
      fluorescence: req.query.fluorescence ? req.query.fluorescence.split(',') : undefined,
      labs:         req.query.certificate  ? req.query.certificate.split(',')  : undefined,
      shape:        req.query.shape        ? req.query.shape.toUpperCase().replace(/[\s-]/g, '_') : undefined,
      labgrown:     req.query.labgrown === 'true',
      limit:        parseInt(req.query.limit) || 20,
      offset:       parseInt(req.query.offset) || 0,
    };

    const diamonds = await nivodaService.searchDiamonds(filters);

    // Filter by certificate if specified (client-side filtering as backup)
    let filteredItems = diamonds.items || [];
    if (req.query.certificate) {
      filteredItems = filteredItems.filter(d =>
        d.diamond?.certificate?.lab?.toUpperCase() === req.query.certificate.toUpperCase()
      );
    }

    return res.json({
      success: true,
      data: {
        ...diamonds,
        items: filteredItems
      },
      message: 'Diamonds retrieved successfully',
      count: filteredItems.length || 0,
      total: diamonds.total_count || 0
    });
  } catch (error) {
    console.error('Error searching diamonds:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to search diamonds'
    });
  }
}

/**
 * Get price suggestions for diamond specs
 * Query params: carat, clarity, color, cut, certificate (optional)
 * Returns: matching diamonds with prices, filtered by certificate if specified
 */
// Relative price multipliers used only to scale an INDICATIVE (made-to-order) estimate
// when live stock for the exact spec is momentarily unavailable. VS2 / G are the 1.00 base.
const CLARITY_MULT = { FL: 1.36, IF: 1.24, VVS1: 1.15, VVS2: 1.08, VS1: 1.05, VS2: 1.00, SI1: 0.90, SI2: 0.82, I1: 0.70, I2: 0.62 };
const COLOUR_MULT = { D: 1.12, E: 1.08, F: 1.05, G: 1.00, H: 0.95, I: 0.90, J: 0.85, K: 0.80 };

async function getDiamondPriceBySuggestions(req, res) {
  try {
    const { carat, clarity, color, cut, certificate, stoneType, shape, polish, symmetry, fluorescence } = req.query;

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

    // Cascade: exact spec → broaden refinements → widen carat → indicative model estimate.
    // McCulloch sources the stone to spec, so the customer should always see a price.
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

    // 5) Pure model estimate (no live stock at all for this shape/size, e.g. Cushion 0.5ct):
    //    anchor to the marked-up 0.5ct G/VS2 diamond floor for the shape, scale by carat
    //    (price rises ~carat^1.9) and the clarity/colour multipliers. Always yields a price.
    if (!result) {
      note = 'estimated'; estimated = true;
      const shapeBase = diamondFloorGBP(shape);                 // BASE 0.5ct G/VS2 for the shape
      const caratFactor = Math.pow((ct || 0.5) / 0.5, 1.9);
      const baseEst = shapeBase * caratFactor * (CLARITY_MULT[clarity] ?? 1) * (COLOUR_MULT[color] ?? 1) * (labgrown ? 0.35 : 1);
      const est = applyMarkupGbp(baseEst, labgrown);            // apply the owner's diamond markup
      result = { min: Math.round(est * 0.9), avg: Math.round(est), max: Math.round(est * 1.15), items: [] };
    }

    if (result) {
      return res.json({
        success: true,
        data: {
          specs: { carat: carat || 'N/A', clarity: clarity || 'N/A', color: color || 'N/A', cut: cut || 'N/A', shape: shape || 'Any', stoneType: stoneType || 'natural', certificate: certificate || 'Any' },
          prices: { min: result.min, avg: result.avg, max: result.max },
          matchingDiamonds: result.items || [],
          count: (result.items || []).length,
          estimated,          // true => indicative made-to-order price, not a specific in-stock stone
          priceBasis: note,   // 'exact' | 'broadened' | 'estimated'
        },
        message: estimated ? 'Indicative made-to-order price' : 'Diamond price suggestions retrieved',
      });
    }

    return res.json({
      success: true,
      data: { specs: { carat, clarity, color, cut }, prices: { min: 0, avg: 0, max: 0 }, matchingDiamonds: [], count: 0, estimated: false, priceBasis: 'none' },
      message: 'No matching diamonds found for these specs',
    });
  } catch (error) {
    console.error('Error getting diamond price suggestions:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to get price suggestions' });
  }
}

/**
 * Get specific diamond by ID
 */
async function getDiamondById(req, res) {
  try {
    const { diamondId } = req.params;

    if (!diamondId) {
      return res.status(400).json({
        success: false,
        error: 'Diamond ID is required'
      });
    }

    const diamond = await nivodaService.getDiamondById(diamondId);

    return res.json({
      success: true,
      data: diamond,
      message: 'Diamond retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching diamond:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch diamond'
    });
  }
}

/**
 * Search gemstones from Nivoda API
 */
async function searchGemstones(req, res) {
  try {
    const filters = req.query;
    const gemstones = await nivodaService.searchGemstones(filters);

    return res.json({
      success: true,
      data: gemstones,
      message: 'Gemstones retrieved successfully'
    });
  } catch (error) {
    console.error('Error searching gemstones:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to search gemstones'
    });
  }
}

module.exports = {
  getAvailableOptions,
  searchDiamonds,
  getDiamondById,
  getDiamondPriceBySuggestions,
  searchGemstones
};

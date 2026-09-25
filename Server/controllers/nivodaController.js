/**
 * Nivoda API Controller
 * Handles all Nivoda API related endpoints
 */

const nivodaService = require('../services/nivodaService');
const { centsToGBP, summarisePrices } = require('../services/pricingService');
const metalPriceService = require('../services/metalPriceService');
const { diamondFloorGBP } = require('../services/engagementFloor');
const { applyMarkupGbp } = require('../services/diamondMarkup');
const { estimateDiamondPriceGBP } = require('../services/diamondPricingService');

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
async function getDiamondPriceBySuggestions(req, res) {
  try {
    const { carat, clarity, color, cut, certificate, stoneType, shape } = req.query;

    // Pricing cascade lives in diamondPricingService so the PDP price and the
    // payment floor (stripeController.computeServerFloor) stay identical.
    const result = await estimateDiamondPriceGBP(req.query);

    if (result && (result.min || result.avg || result.max)) {
      return res.json({
        success: true,
        data: {
          specs: { carat: carat || 'N/A', clarity: clarity || 'N/A', color: color || 'N/A', cut: cut || 'N/A', shape: shape || 'Any', stoneType: stoneType || 'natural', certificate: certificate || 'Any' },
          prices: { min: result.min, avg: result.avg, max: result.max },
          matchingDiamonds: result.items || [],
          count: (result.items || []).length,
          estimated: result.estimated,   // true => indicative made-to-order price, not a specific in-stock stone
          priceBasis: result.priceBasis, // 'exact' | 'broadened' | 'estimated'
        },
        message: result.estimated ? 'Indicative made-to-order price' : 'Diamond price suggestions retrieved',
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

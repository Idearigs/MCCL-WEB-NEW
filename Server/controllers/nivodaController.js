/**
 * Nivoda API Controller
 * Handles all Nivoda API related endpoints
 */

const nivodaService = require('../services/nivodaService');
const { centsToGBP, summarisePrices } = require('../services/pricingService');

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
    const { carat, clarity, color, cut, certificate, stoneType, shape, polish, symmetry, fluorescence } = req.query;

    const labgrown = stoneType === 'lab-grown';
    const shapeNivoda = shape ? shape.toUpperCase().replace(/[\s-]/g, '_') : undefined;

    const filters = {
      minCarat: Math.max(0.1, (parseFloat(carat) || 1.0) - 0.25),
      maxCarat: (parseFloat(carat) || 1.0) + 0.25,
      minPrice: 0,
      maxPrice: 500000,
      clarity: clarity ? [clarity] : undefined,
      color: color ? [color] : undefined,
      cut: cut ? cut.split(',') : undefined,
      labgrown,
      shape: shapeNivoda,
      labs: certificate ? certificate.split(',') : undefined,
      polish: polish ? polish.split(',') : undefined,
      symmetry: symmetry ? symmetry.split(',') : undefined,
      fluorescence: fluorescence ? fluorescence.split(',') : undefined,
      limit: 10
    };

    const diamonds = await nivodaService.searchDiamonds(filters);

    // Filter by certificate client-side (lab filter removed from Nivoda GraphQL)
    let filteredDiamonds = diamonds.items || [];
    if (certificate) {
      const certList = certificate.split(',').map(c => c.trim().toUpperCase());
      filteredDiamonds = filteredDiamonds.filter(d =>
        certList.includes(d.diamond?.certificate?.lab?.toUpperCase())
      );
    }

    if (filteredDiamonds.length > 0) {
      const { min: minPrice, avg: avgPrice, max: maxPrice } = summarisePrices(filteredDiamonds);

      return res.json({
        success: true,
        data: {
          specs: {
            carat: carat || 'N/A',
            clarity: clarity || 'N/A',
            color: color || 'N/A',
            cut: cut || 'N/A',
            shape: shape || 'Any',
            stoneType: stoneType || 'natural',
            certificate: certificate || 'Any'
          },
          prices: { min: minPrice, avg: avgPrice, max: maxPrice },
          matchingDiamonds: filteredDiamonds,
          count: filteredDiamonds.length
        },
        message: 'Diamond price suggestions retrieved'
      });
    } else {
      return res.json({
        success: true,
        data: {
          specs: { carat, clarity, color, cut },
          prices: { min: 0, avg: 0, max: 0 },
          matchingDiamonds: [],
          count: 0
        },
        message: 'No matching diamonds found for these specs'
      });
    }
  } catch (error) {
    console.error('Error getting diamond price suggestions:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get price suggestions'
    });
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

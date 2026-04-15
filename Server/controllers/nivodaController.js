/**
 * Nivoda API Controller
 * Handles all Nivoda API related endpoints
 */

const nivodaService = require('../services/nivodaService');

/**
 * Get available Nivoda diamond options
 * Returns available carat weights, clarities, colors, cuts based on Nivoda API documentation
 * Note: The Nivoda API doesn't return spec values in the response, so we use documented filter values
 */
async function getAvailableOptions(req, res) {
  try {
    // Test API connectivity by making a simple query
    await nivodaService.searchDiamonds({
      minCarat: 0.5,
      maxCarat: 1,
      limit: 1,
      offset: 0
    });

    // Return available options based on Nivoda API documentation
    const availableOptions = {
      // Carat weights - common options
      carats: ['0.5', '0.75', '1.0', '1.25', '1.5', '1.75', '2.0', '2.5', '3.0', '5.0', '10.0'],

      // Diamond Clarity grades (from GIA scale)
      clarities: ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'SI3', 'I1', 'I2', 'I3'],

      // Diamond Color grades (from GIA scale)
      colours: ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'],

      // Diamond Cut grades (VALID Nivoda values only)
      cuts: ['EX', 'VG', 'G', 'F'],

      // Stone type
      stoneTypes: ['Natural', 'Lab-Grown']
    };

    return res.json({
      success: true,
      data: availableOptions,
      message: 'Available Nivoda diamond options (based on API documentation)',
      source: 'nivoda_documentation'
    });
  } catch (error) {
    console.error('Error fetching available options from Nivoda API:', error);
    // Fallback to standard options if API fails
    const fallbackOptions = {
      carats: ['0.5', '0.75', '1.0', '1.25', '1.5', '1.75', '2.0', '2.5', '3.0', '5.0'],
      clarities: ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'],
      colours: ['D', 'E', 'F', 'G', 'H', 'I', 'J'],
      cuts: ['EX', 'VG', 'G', 'F'],
      stoneTypes: ['Natural', 'Lab-Grown']
    };

    return res.json({
      success: true,
      data: fallbackOptions,
      message: 'Using fallback standard diamond options',
      source: 'fallback',
      error: error.message
    });
  }
}

/**
 * Search diamonds from Nivoda API
 * Query params: minCarat, maxCarat, minPrice, maxPrice, color, clarity, cut, certificate, limit, offset
 */
async function searchDiamonds(req, res) {
  try {
    // Build filters from query params
    const filters = {
      minCarat: parseFloat(req.query.minCarat) || 0.5,
      maxCarat: parseFloat(req.query.maxCarat) || 10,
      minPrice: parseFloat(req.query.minPrice) || 0,
      maxPrice: parseFloat(req.query.maxPrice) || 500000,
      color: req.query.color ? req.query.color.split(',') : undefined,
      clarity: req.query.clarity ? req.query.clarity.split(',') : undefined,
      cut: req.query.cut ? req.query.cut.split(',') : undefined,
      certificate: req.query.certificate ? req.query.certificate : undefined,
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
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
    const { carat, clarity, color, cut, certificate } = req.query;

    // Build filter with specific specs
    const filters = {
      minCarat: Math.max(0.1, (parseFloat(carat) || 1.0) - 0.25),
      maxCarat: (parseFloat(carat) || 1.0) + 0.25,
      minPrice: 0,
      maxPrice: 500000,
      clarity: clarity ? [clarity] : undefined,
      color: color ? [color] : undefined,
      cut: cut ? [cut] : undefined,
      certificate: certificate ? certificate : undefined,
      limit: 5
    };

    const diamonds = await nivodaService.searchDiamonds(filters);

    // Filter by certificate if specified (client-side filtering as backup)
    let filteredDiamonds = diamonds.items || [];
    if (certificate) {
      filteredDiamonds = filteredDiamonds.filter(d =>
        d.diamond?.certificate?.lab?.toUpperCase() === certificate.toUpperCase()
      );
    }

    if (filteredDiamonds.length > 0) {
      // Nivoda returns price in GBP cents (we request preferredCurrency: GBP)
      // Divide by 100 to get pounds sterling
      const toPounds = (cents) => Math.round(cents / 100);

      const prices = filteredDiamonds.map(d => toPounds(d.price));
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      return res.json({
        success: true,
        data: {
          specs: {
            carat: carat || 'N/A',
            clarity: clarity || 'N/A',
            color: color || 'N/A',
            cut: cut || 'N/A',
            certificate: certificate || 'Any'
          },
          prices: {
            min: minPrice,
            avg: Math.round(avgPrice),
            max: maxPrice
          },
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

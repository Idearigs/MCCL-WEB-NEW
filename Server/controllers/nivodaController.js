/**
 * Nivoda API Controller
 * Handles all Nivoda API related endpoints
 */

const nivodaService = require('../services/nivodaService');

/**
 * Get available Nivoda diamond options
 * Returns all available carat weights, clarities, colors, cuts, and stone types
 */
async function getAvailableOptions(req, res) {
  try {
    // These are standard diamond grading scales available from Nivoda API
    const availableOptions = {
      carats: [
        '0.5', '0.75', '1.0', '1.25', '1.5', '1.75', '2.0', '2.25', '2.5',
        '2.75', '3.0', '3.5', '4.0', '4.5', '5.0', '6.0', '7.0', '8.0',
        '9.0', '10.0'
      ],
      clarities: [
        'IF',     // Internally Flawless
        'VVS1',   // Very Very Slightly Included 1
        'VVS2',   // Very Very Slightly Included 2
        'VS1',    // Very Slightly Included 1
        'VS2',    // Very Slightly Included 2
        'SI1',    // Slightly Included 1
        'SI2',    // Slightly Included 2
        'I1'      // Included 1
      ],
      colours: [
        'D', 'E', 'F',  // Colorless
        'G', 'H', 'I', 'J',  // Near Colorless
        'K', 'L', 'M',  // Faint
        'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'  // Light/Fancy
      ],
      cuts: [
        'EX',   // Excellent
        'VG',   // Very Good
        'G',    // Good
        'F'     // Fair
      ],
      stoneTypes: [
        'Natural',
        'Lab-Grown'
      ]
    };

    return res.json({
      success: true,
      data: availableOptions,
      message: 'Available Nivoda diamond options retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching available options:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch available options'
    });
  }
}

/**
 * Search diamonds from Nivoda API
 */
async function searchDiamonds(req, res) {
  try {
    const filters = req.query;
    const diamonds = await nivodaService.searchDiamonds(filters);

    return res.json({
      success: true,
      data: diamonds,
      message: 'Diamonds retrieved successfully'
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
  searchGemstones
};

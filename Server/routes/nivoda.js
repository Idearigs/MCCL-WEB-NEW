/**
 * Nivoda API Routes
 * Endpoints for accessing Nivoda diamond and gemstone data
 */

const express = require('express');
const router = express.Router();
const {
  getAvailableOptions,
  searchDiamonds,
  getDiamondById,
  getDiamondPriceBySuggestions,
  searchGemstones
} = require('../controllers/nivodaController');

/**
 * GET /api/v1/nivoda/available-options
 * Get all available diamond specification options from Nivoda
 * Returns: carats, clarities, colors, cuts, stone types
 */
router.get('/available-options', getAvailableOptions);

/**
 * GET /api/v1/nivoda/diamonds/search
 * Search for diamonds with filters
 * Query params:
 *   - minCarat: minimum carat weight (default: 0.5)
 *   - maxCarat: maximum carat weight (default: 10)
 *   - minPrice: minimum price (default: 0)
 *   - maxPrice: maximum price (default: 500000)
 *   - color: comma-separated color grades (default: D,E,F,G,H,I)
 *   - clarity: comma-separated clarity grades (default: VS1,VS2,VVS1,VVS2,IF)
 *   - cut: comma-separated cut qualities (default: EX,VG,G)
 *   - limit: number of results (default: 20)
 *   - offset: pagination offset (default: 0)
 */
router.get('/diamonds/search', searchDiamonds);

/**
 * GET /api/v1/nivoda/diamonds/price-suggestions
 * Get price suggestions based on diamond specs
 * Query params:
 *   - carat: carat weight
 *   - clarity: clarity grade
 *   - color: color grade
 *   - cut: cut quality
 * Returns: matching diamonds and price range
 */
router.get('/diamonds/price-suggestions', getDiamondPriceBySuggestions);

/**
 * GET /api/v1/nivoda/diamonds/:diamondId
 * Get specific diamond details
 */
router.get('/diamonds/:diamondId', getDiamondById);

/**
 * GET /api/v1/nivoda/gemstones/search
 * Search for gemstones with filters
 * Query params:
 *   - minCarat: minimum carat weight (default: 0.5)
 *   - maxCarat: maximum carat weight (default: 10)
 *   - color: comma-separated color values
 *   - limit: number of results (default: 20)
 */
router.get('/gemstones/search', searchGemstones);

module.exports = router;

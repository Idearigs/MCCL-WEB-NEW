const express = require('express');
const router = express.Router();

// Import the same controller functions but without auth middleware
const {
  getRingTypes,
  getGemstones,
  getMetals,
  getCollections
} = require('../controllers/adminCategoriesController');

const {
  getEarringTypes,
  getNecklaceTypes,
  getBraceletTypes
} = require('../controllers/adminJewelryCategoriesController');

const { getModels } = require('../models');

// Public filter endpoints (no authentication required)
router.get('/ring-types', getRingTypes);
router.get('/gemstones', getGemstones);
router.get('/metals', getMetals);
router.get('/collections', getCollections);

// Jewelry category endpoints (public)
router.get('/earring-types', getEarringTypes);
router.get('/necklace-types', getNecklaceTypes);
router.get('/bracelet-types', getBraceletTypes);

// Diamond Sizes endpoint (public - for Engagement Rings)
router.get('/diamond-sizes', async (req, res) => {
  try {
    const { DiamondSizes } = getModels();

    if (!DiamondSizes) {
      return res.json({
        success: true,
        data: []
      });
    }

    const diamondSizes = await DiamondSizes.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'display_name', 'description', 'sort_order'],
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: diamondSizes
    });
  } catch (error) {
    console.error('Error fetching diamond sizes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch diamond sizes',
      error: error.message
    });
  }
});

module.exports = router;
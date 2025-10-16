const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/adminAuth');

// Apply authentication middleware to all jewelry category routes
router.use(adminAuth);

const {
  // Jewelry Types
  getJewelryTypes,
  getJewelryTypeById,
  createJewelryType,
  updateJewelryType,
  deleteJewelryType,

  // Jewelry Sub Types
  getJewelrySubTypes,
  getJewelrySubTypeById,
  createJewelrySubType,
  updateJewelrySubType,
  deleteJewelrySubType,

  // Earring Types
  getEarringTypes,
  getEarringTypeById,
  createEarringType,
  updateEarringType,
  deleteEarringType,

  // Necklace Types
  getNecklaceTypes,
  getNecklaceTypeById,
  createNecklaceType,
  updateNecklaceType,
  deleteNecklaceType,

  // Bracelet Types
  getBraceletTypes,
  getBraceletTypeById,
  createBraceletType,
  updateBraceletType,
  deleteBraceletType
} = require('../controllers/adminJewelryCategoriesController');

// =====================================================
// JEWELRY TYPES ROUTES (Main Categories)
// =====================================================
router.get('/jewelry-types', getJewelryTypes);
router.get('/jewelry-types/:id', getJewelryTypeById);
router.post('/jewelry-types', createJewelryType);
router.put('/jewelry-types/:id', updateJewelryType);
router.delete('/jewelry-types/:id', deleteJewelryType);

// =====================================================
// JEWELRY SUB TYPES ROUTES (Engagement, Wedding, etc.)
// =====================================================
router.get('/jewelry-sub-types', getJewelrySubTypes);
router.get('/jewelry-sub-types/:id', getJewelrySubTypeById);
router.post('/jewelry-sub-types', createJewelrySubType);
router.put('/jewelry-sub-types/:id', updateJewelrySubType);
router.delete('/jewelry-sub-types/:id', deleteJewelrySubType);

// =====================================================
// EARRING TYPES ROUTES
// =====================================================
router.get('/earring-types', getEarringTypes);
router.get('/earring-types/:id', getEarringTypeById);
router.post('/earring-types', createEarringType);
router.put('/earring-types/:id', updateEarringType);
router.delete('/earring-types/:id', deleteEarringType);

// =====================================================
// NECKLACE TYPES ROUTES
// =====================================================
router.get('/necklace-types', getNecklaceTypes);
router.get('/necklace-types/:id', getNecklaceTypeById);
router.post('/necklace-types', createNecklaceType);
router.put('/necklace-types/:id', updateNecklaceType);
router.delete('/necklace-types/:id', deleteNecklaceType);

// =====================================================
// BRACELET TYPES ROUTES
// =====================================================
router.get('/bracelet-types', getBraceletTypes);
router.get('/bracelet-types/:id', getBraceletTypeById);
router.post('/bracelet-types', createBraceletType);
router.put('/bracelet-types/:id', updateBraceletType);
router.delete('/bracelet-types/:id', deleteBraceletType);

module.exports = router;

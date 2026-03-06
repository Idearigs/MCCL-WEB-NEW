const express = require('express');
const router = express.Router();

const {
  adminLogin,
  adminLogout,
  refreshToken,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  getDevices,
  removeDevice,
  generatePairingCode,
  verifyPairing,
  getDashboardStats
} = require('../controllers/adminController');

const adminProductController = require('../controllers/adminProductController');
const adminCategoriesRoutes = require('./adminCategories');
const adminJewelryCategoriesRoutes = require('./adminJewelryCategories');
const uploadRoutes = require('./upload');
const watchRoutes = require('./watchRoutes');
const weddingRingsRoutes = require('./weddingRingsRoutes');
const { validateProduct, validateBulkUpdate } = require('../validators/productValidator');

const { adminAuth, requireAdmin, requireSuperAdmin } = require('../middleware/adminAuth');
const { joiValidation } = require('../middleware/validation');
const { authRateLimit } = require('../middleware/security');

// Validation schemas
const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  device_id: Joi.string().allow(null, '')
});

const updateProfileSchema = Joi.object({
  first_name: Joi.string().min(1).max(100),
  last_name: Joi.string().min(1).max(100),
  avatar: Joi.string().uri().allow(null, '')
}).min(1);

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')).required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    })
});

// Public routes (no auth required)
router.post('/login', authRateLimit, joiValidation(loginSchema), adminLogin);
router.post('/refresh-token', refreshToken);
router.post('/devices/verify-link', verifyPairing);

// Protected routes (require authentication)
router.use(adminAuth);

router.post('/logout', adminLogout);
router.get('/profile', getAdminProfile);
router.put('/profile', joiValidation(updateProfileSchema), updateAdminProfile);
router.put('/change-password', joiValidation(changePasswordSchema), changePassword);
router.get('/dashboard/stats', getDashboardStats);

// Device Management
router.get('/devices', getDevices);
router.delete('/devices/:sessionId', removeDevice);
router.post('/devices/link', generatePairingCode);

// Category Management Routes
router.use('/categories', adminCategoriesRoutes);

// Jewelry Category Management Routes (New hierarchical system)
router.use('/jewelry-categories', adminJewelryCategoriesRoutes);

// Watch Management Routes
router.use('/watches', watchRoutes);

// Wedding Rings (Diamond-cut) Management Routes
router.use('/wedding-rings', weddingRingsRoutes);

// Upload Routes
router.use('/upload', uploadRoutes);

module.exports = router;

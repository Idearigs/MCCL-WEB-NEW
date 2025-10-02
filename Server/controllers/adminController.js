const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getAdminModels } = require('../models/adminModels');
const config = require('../config');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../config/database');

// Generate JWT Token
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

// Admin Login
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  // Get models at runtime
  const { AdminUser, AdminSession } = getAdminModels();

  // Find admin user
  const adminUser = await AdminUser.findOne({
    where: { email, is_active: true }
  });

  if (!adminUser) {
    logger.warn(`Failed login attempt for email: ${email}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Validate password
  const isValidPassword = await adminUser.validatePassword(password);
  if (!isValidPassword) {
    logger.warn(`Failed login attempt for email: ${email} - invalid password`);
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Create session token
  const tokenPayload = {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    type: 'admin'
  };

  const token = generateToken(tokenPayload);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Clean up old sessions
  await AdminSession.destroy({
    where: {
      admin_user_id: adminUser.id,
      expires_at: { [require('sequelize').Op.lt]: new Date() }
    }
  });

  // Create new session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await AdminSession.create({
    admin_user_id: adminUser.id,
    token_hash: tokenHash,
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    expires_at: expiresAt
  });

  // Update login statistics
  await adminUser.update({
    last_login_at: new Date(),
    login_count: adminUser.login_count + 1
  });

  logger.info(`Admin login successful: ${email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      admin: adminUser.toSafeObject(),
      expires_at: expiresAt
    }
  });
});

// Admin Logout
const adminLogout = asyncHandler(async (req, res) => {
  const { AdminSession } = getAdminModels();
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await AdminSession.update(
      { is_active: false },
      { where: { token_hash: tokenHash } }
    );
  }

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Get Current Admin Profile
const getAdminProfile = asyncHandler(async (req, res) => {
  const { AdminUser } = getAdminModels();
  const adminUser = await AdminUser.findByPk(req.admin.id);

  if (!adminUser) {
    return res.status(404).json({
      success: false,
      message: 'Admin user not found'
    });
  }

  res.json({
    success: true,
    data: adminUser.toSafeObject()
  });
});

// Update Admin Profile
const updateAdminProfile = asyncHandler(async (req, res) => {
  const { AdminUser } = getAdminModels();
  const { first_name, last_name, avatar } = req.body;

  const adminUser = await AdminUser.findByPk(req.admin.id);

  if (!adminUser) {
    return res.status(404).json({
      success: false,
      message: 'Admin user not found'
    });
  }

  await adminUser.update({
    first_name: first_name || adminUser.first_name,
    last_name: last_name || adminUser.last_name,
    avatar: avatar !== undefined ? avatar : adminUser.avatar
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: adminUser.toSafeObject()
  });
});

// Change Password
const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  const adminUser = await AdminUser.findByPk(req.admin.id);

  if (!adminUser) {
    return res.status(404).json({
      success: false,
      message: 'Admin user not found'
    });
  }

  // Validate current password
  const isValidPassword = await adminUser.validatePassword(current_password);
  if (!isValidPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  await adminUser.update({ password: new_password });

  // Invalidate all existing sessions except current
  const currentToken = req.headers.authorization?.replace('Bearer ', '');
  const currentTokenHash = crypto.createHash('sha256').update(currentToken).digest('hex');

  await AdminSession.update(
    { is_active: false },
    {
      where: {
        admin_user_id: adminUser.id,
        token_hash: { [require('sequelize').Op.ne]: currentTokenHash }
      }
    }
  );

  logger.info(`Password changed for admin: ${adminUser.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Admin Dashboard Stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const { Product, Category, Collection } = require('../models').getModels();

  const [
    totalProducts,
    activeProducts,
    totalCategories,
    totalCollections,
    featuredProducts
  ] = await Promise.all([
    Product.count(),
    Product.count({ where: { is_active: true } }),
    Category.count({ where: { is_active: true } }),
    Collection.count({ where: { is_active: true } }),
    Product.count({ where: { is_featured: true, is_active: true } })
  ]);

  // Recent products
  const recentProducts = await Product.findAll({
    limit: 5,
    order: [['created_at', 'DESC']],
    attributes: ['id', 'name', 'slug', 'base_price', 'created_at'],
    include: [
      {
        model: require('../models').getModels().ProductImage,
        as: 'images',
        where: { is_primary: true },
        required: false,
        attributes: ['image_url']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      stats: {
        total_products: totalProducts,
        active_products: activeProducts,
        total_categories: totalCategories,
        total_collections: totalCollections,
        featured_products: featuredProducts
      },
      recent_products: recentProducts.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: `£${parseFloat(product.base_price).toLocaleString()}`,
        image: product.images[0]?.image_url || null,
        created_at: product.created_at
      }))
    }
  });
});

module.exports = {
  adminLogin,
  adminLogout,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  getDashboardStats
};
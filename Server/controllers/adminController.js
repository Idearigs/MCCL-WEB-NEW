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
  const { Product, Category, Collection, Order, OrderItem } = require('../models').getModels();
  const { Sequelize } = require('sequelize');

  // Product stats
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

  // Order stats - simple counts
  const totalOrders = Order ? await Order.count() : 0;
  const pendingOrders = Order ? await Order.count({ where: { status: 'pending' } }) : 0;
  const processingOrders = Order ? await Order.count({ where: { status: 'processing' } }) : 0;
  const deliveredOrders = Order ? await Order.count({ where: { status: 'delivered' } }) : 0;
  const totalRevenueResult = Order ? await Order.sum('total_amount') : 0;

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

  // Get recent orders
  let recentOrders = [];
  if (Order) {
    recentOrders = await Order.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'order_number', 'status', 'payment_status', 'total_amount', 'customer_email', 'customer_name', 'created_at'],
      raw: true
    });
  }

  // Get today's and month's income with simple approach
  let todayRevenue = 0;
  let todayOrderCount = 0;
  let monthRevenue = 0;
  let monthOrderCount = 0;

  if (Order) {
    try {
      // Get today's orders
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayOrders = await Order.findAll({
        where: {
          payment_status: 'paid',
          created_at: {
            [Sequelize.Op.gte]: todayStart
          }
        },
        attributes: ['total_amount'],
        raw: true
      });

      todayOrderCount = todayOrders.length;
      todayRevenue = todayOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

      // Get this month's orders
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthOrders = await Order.findAll({
        where: {
          payment_status: 'paid',
          created_at: {
            [Sequelize.Op.gte]: monthStart
          }
        },
        attributes: ['total_amount'],
        raw: true
      });

      monthOrderCount = monthOrders.length;
      monthRevenue = monthOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    } catch (error) {
      logger.warn('Error calculating income stats:', error.message);
    }
  }

  res.json({
    success: true,
    data: {
      stats: {
        total_products: totalProducts,
        active_products: activeProducts,
        total_categories: totalCategories,
        total_collections: totalCollections,
        featured_products: featuredProducts,
        total_orders: totalOrders,
        pending_orders: pendingOrders,
        processing_orders: processingOrders,
        delivered_orders: deliveredOrders,
        total_revenue: totalRevenueResult || 0,
        today_revenue: todayRevenue,
        today_orders: todayOrderCount,
        month_revenue: monthRevenue,
        month_orders: monthOrderCount
      },
      recent_products: recentProducts.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: `£${parseFloat(product.base_price).toLocaleString()}`,
        image: product.images[0]?.image_url || null,
        created_at: product.created_at
      })),
      recent_orders: recentOrders.map(order => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        total_amount: parseFloat(order.total_amount),
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        items_count: 0,
        created_at: order.created_at
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
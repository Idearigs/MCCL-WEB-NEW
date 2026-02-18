const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getAdminModels } = require('../models/adminModels');
const config = require('../config');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../config/database');
const { Op } = require('sequelize');

// Generate Access Token (short-lived)
const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = (payload) => {
  return jwt.sign({ ...payload, tokenType: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  });
};

// Parse device name from user-agent
const parseDeviceName = (userAgent) => {
  if (!userAgent) return 'Unknown Device';
  if (/iPhone/i.test(userAgent)) return 'iPhone';
  if (/iPad/i.test(userAgent)) return 'iPad';
  if (/Android/i.test(userAgent)) {
    const match = userAgent.match(/Android.*?;\s*([^)]+)/);
    return match ? match[1].trim().split(' Build')[0] : 'Android Device';
  }
  if (/Mac OS/i.test(userAgent)) return 'Mac';
  if (/Windows/i.test(userAgent)) return 'Windows PC';
  if (/Linux/i.test(userAgent)) return 'Linux PC';
  return 'Browser';
};

// Admin Login
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password, device_id } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  const { AdminUser, AdminSession } = getAdminModels();

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

  const isValidPassword = await adminUser.validatePassword(password);
  if (!isValidPassword) {
    logger.warn(`Failed login attempt for email: ${email} - invalid password`);
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Clean up expired sessions
  await AdminSession.destroy({
    where: {
      admin_user_id: adminUser.id,
      expires_at: { [Op.lt]: new Date() }
    }
  });

  // Check active device count
  const activeDevices = await AdminSession.count({
    where: {
      admin_user_id: adminUser.id,
      is_active: true,
      expires_at: { [Op.gt]: new Date() }
    }
  });

  // If device_id matches existing session, reuse it
  if (device_id) {
    const existingSession = await AdminSession.findOne({
      where: {
        admin_user_id: adminUser.id,
        device_id,
        is_active: true,
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (existingSession) {
      // Refresh tokens for existing device
      const tokenPayload = {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        type: 'admin'
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);
      const accessTokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);

      await existingSession.update({
        token_hash: accessTokenHash,
        refresh_token_hash: refreshTokenHash,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        last_active_at: new Date(),
        expires_at: refreshExpiresAt
      });

      await adminUser.update({
        last_login_at: new Date(),
        login_count: adminUser.login_count + 1
      });

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          token: accessToken,
          refresh_token: refreshToken,
          admin: adminUser.toSafeObject(),
          expires_in: 3600,
          device_count: activeDevices
        }
      });
    }
  }

  // Check max devices (only if this is a genuinely new device)
  if (activeDevices >= config.jwt.maxDevices) {
    return res.status(403).json({
      success: false,
      message: `Maximum ${config.jwt.maxDevices} devices reached. Remove a device first.`,
      code: 'MAX_DEVICES',
      active_devices: activeDevices
    });
  }

  // Create tokens
  const tokenPayload = {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    type: 'admin'
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  const accessTokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);

  const deviceName = parseDeviceName(req.get('User-Agent'));
  const sessionDeviceId = device_id || crypto.randomBytes(16).toString('hex');

  await AdminSession.create({
    admin_user_id: adminUser.id,
    token_hash: accessTokenHash,
    refresh_token_hash: refreshTokenHash,
    device_name: deviceName,
    device_id: sessionDeviceId,
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    is_linked: true,
    last_active_at: new Date(),
    expires_at: refreshExpiresAt
  });

  await adminUser.update({
    last_login_at: new Date(),
    login_count: adminUser.login_count + 1
  });

  logger.info(`Admin login successful: ${email} (device: ${deviceName})`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token: accessToken,
      refresh_token: refreshToken,
      device_id: sessionDeviceId,
      admin: adminUser.toSafeObject(),
      expires_in: 3600,
      device_count: activeDevices + 1
    }
  });
});

// Refresh Token
const refreshToken = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  const { AdminUser, AdminSession } = getAdminModels();

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refresh_token, config.jwt.refreshSecret);
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      code: 'REFRESH_EXPIRED'
    });
  }

  if (decoded.tokenType !== 'refresh' || decoded.type !== 'admin') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token type'
    });
  }

  const refreshTokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');

  // Find session with this refresh token
  const session = await AdminSession.findOne({
    where: {
      refresh_token_hash: refreshTokenHash,
      is_active: true,
      expires_at: { [Op.gt]: new Date() }
    },
    include: [{
      model: AdminUser,
      as: 'admin_user',
      where: { is_active: true }
    }]
  });

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Session not found or expired',
      code: 'REFRESH_EXPIRED'
    });
  }

  // Generate new access token
  const tokenPayload = {
    id: session.admin_user.id,
    email: session.admin_user.email,
    role: session.admin_user.role,
    type: 'admin'
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newAccessTokenHash = crypto.createHash('sha256').update(newAccessToken).digest('hex');

  // Update session with new access token hash
  await session.update({
    token_hash: newAccessTokenHash,
    last_active_at: new Date()
  });

  res.json({
    success: true,
    data: {
      token: newAccessToken,
      expires_in: 3600
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
  const { AdminUser, AdminSession } = getAdminModels();

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

  const isValidPassword = await adminUser.validatePassword(current_password);
  if (!isValidPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  await adminUser.update({ password: new_password });

  // Invalidate all existing sessions except current
  const currentToken = req.headers.authorization?.replace('Bearer ', '');
  const currentTokenHash = crypto.createHash('sha256').update(currentToken).digest('hex');

  await AdminSession.update(
    { is_active: false },
    {
      where: {
        admin_user_id: adminUser.id,
        token_hash: { [Op.ne]: currentTokenHash }
      }
    }
  );

  logger.info(`Password changed for admin: ${adminUser.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Get Devices
const getDevices = asyncHandler(async (req, res) => {
  const { AdminSession } = getAdminModels();

  const sessions = await AdminSession.findAll({
    where: {
      admin_user_id: req.admin.id,
      is_active: true,
      expires_at: { [Op.gt]: new Date() }
    },
    attributes: ['id', 'device_name', 'device_id', 'ip_address', 'last_active_at', 'is_linked', 'created_at'],
    order: [['last_active_at', 'DESC']]
  });

  const currentToken = req.headers.authorization?.replace('Bearer ', '');
  const currentTokenHash = crypto.createHash('sha256').update(currentToken).digest('hex');

  // Find current session to mark it
  const currentSession = await AdminSession.findOne({
    where: { token_hash: currentTokenHash },
    attributes: ['id']
  });

  res.json({
    success: true,
    data: {
      devices: sessions.map(s => ({
        id: s.id,
        device_name: s.device_name || 'Unknown Device',
        ip_address: s.ip_address,
        last_active_at: s.last_active_at,
        is_linked: s.is_linked,
        is_current: currentSession && s.id === currentSession.id,
        created_at: s.created_at
      })),
      max_devices: config.jwt.maxDevices
    }
  });
});

// Remove Device
const removeDevice = asyncHandler(async (req, res) => {
  const { AdminSession } = getAdminModels();
  const { sessionId } = req.params;

  const session = await AdminSession.findOne({
    where: {
      id: sessionId,
      admin_user_id: req.admin.id,
      is_active: true
    }
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Device not found'
    });
  }

  // Don't allow removing current device via this endpoint
  const currentToken = req.headers.authorization?.replace('Bearer ', '');
  const currentTokenHash = crypto.createHash('sha256').update(currentToken).digest('hex');

  if (session.token_hash === currentTokenHash) {
    return res.status(400).json({
      success: false,
      message: 'Cannot remove current device. Use logout instead.'
    });
  }

  await session.update({ is_active: false });

  logger.info(`Device removed: ${session.device_name} for admin: ${req.admin.email}`);

  res.json({
    success: true,
    message: 'Device removed successfully'
  });
});

// Generate Pairing Code (for QR-based device linking)
const generatePairingCode = asyncHandler(async (req, res) => {
  const code = crypto.randomBytes(32).toString('hex');
  const numericCode = String(Math.floor(100000 + Math.random() * 900000));

  // Store pairing code temporarily (expires in 5 minutes)
  const { AdminSession } = getAdminModels();

  // Store in a simple way - we use a temporary session entry
  const pairingData = {
    code,
    numeric_code: numericCode,
    admin_user_id: req.admin.id,
    created_at: Date.now(),
    expires_at: Date.now() + 5 * 60 * 1000
  };

  // Store in global Map (in production, use Redis)
  if (!global._pairingCodes) global._pairingCodes = new Map();
  global._pairingCodes.set(code, pairingData);
  global._pairingCodes.set(`numeric:${numericCode}`, pairingData);

  // Clean up expired codes
  for (const [key, val] of global._pairingCodes) {
    if (val.expires_at < Date.now()) global._pairingCodes.delete(key);
  }

  res.json({
    success: true,
    data: {
      pairing_code: code,
      numeric_code: numericCode,
      expires_in: 300
    }
  });
});

// Verify Pairing (new device uses this to link)
const verifyPairing = asyncHandler(async (req, res) => {
  const { code, device_id } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Pairing code is required'
    });
  }

  if (!global._pairingCodes) {
    return res.status(400).json({
      success: false,
      message: 'Invalid pairing code'
    });
  }

  // Check both hex and numeric codes
  const pairingData = global._pairingCodes.get(code) || global._pairingCodes.get(`numeric:${code}`);

  if (!pairingData || pairingData.expires_at < Date.now()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired pairing code'
    });
  }

  const { AdminUser, AdminSession } = getAdminModels();

  const adminUser = await AdminUser.findByPk(pairingData.admin_user_id);
  if (!adminUser || !adminUser.is_active) {
    return res.status(401).json({
      success: false,
      message: 'Account not found'
    });
  }

  // Check device limit
  const activeDevices = await AdminSession.count({
    where: {
      admin_user_id: adminUser.id,
      is_active: true,
      expires_at: { [Op.gt]: new Date() }
    }
  });

  if (activeDevices >= config.jwt.maxDevices) {
    return res.status(403).json({
      success: false,
      message: `Maximum ${config.jwt.maxDevices} devices reached.`,
      code: 'MAX_DEVICES'
    });
  }

  // Create new session for paired device
  const tokenPayload = {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    type: 'admin'
  };

  const accessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);
  const accessTokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
  const refreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);

  const deviceName = parseDeviceName(req.get('User-Agent'));
  const sessionDeviceId = device_id || crypto.randomBytes(16).toString('hex');

  await AdminSession.create({
    admin_user_id: adminUser.id,
    token_hash: accessTokenHash,
    refresh_token_hash: refreshTokenHash,
    device_name: deviceName,
    device_id: sessionDeviceId,
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    is_linked: true,
    last_active_at: new Date(),
    expires_at: refreshExpiresAt
  });

  // Clean up used pairing codes
  global._pairingCodes.delete(pairingData.code);
  global._pairingCodes.delete(`numeric:${pairingData.numeric_code}`);

  logger.info(`Device paired via QR: ${deviceName} for admin: ${adminUser.email}`);

  res.json({
    success: true,
    message: 'Device linked successfully',
    data: {
      token: accessToken,
      refresh_token: newRefreshToken,
      device_id: sessionDeviceId,
      admin: adminUser.toSafeObject(),
      expires_in: 3600
    }
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
        price: `\u00A3${parseFloat(product.base_price).toLocaleString()}`,
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
  refreshToken,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  getDevices,
  removeDevice,
  generatePairingCode,
  verifyPairing,
  getDashboardStats
};

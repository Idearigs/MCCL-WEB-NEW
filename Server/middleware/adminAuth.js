const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const { getAdminModels } = require('../models/adminModels');
const { logger } = require('../config/database');

// Helper function to get admin models
const getAdminModelInstance = () => {
  const models = getAdminModels();
  if (!models.AdminUser || !models.AdminSession) {
    throw new Error('Admin models not initialized properly');
  }
  return models;
};

// Admin Authentication Middleware
const adminAuth = async (req, res, next) => {
  try {
    const { AdminUser, AdminSession } = getAdminModelInstance();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const token = authHeader.substring(7);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Verify JWT
    const decoded = jwt.verify(token, config.jwt.secret);

    if (decoded.type !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Check if session exists and is active
    const session = await AdminSession.findOne({
      where: {
        token_hash: tokenHash,
        is_active: true,
        expires_at: { [require('sequelize').Op.gt]: new Date() }
      },
      include: [
        {
          model: AdminUser,
          as: 'admin_user',
          where: { is_active: true }
        }
      ]
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid'
      });
    }

    // Add admin user to request
    req.admin = {
      id: session.admin_user.id,
      email: session.admin_user.email,
      role: session.admin_user.role,
      first_name: session.admin_user.first_name,
      last_name: session.admin_user.last_name
    };

    next();
  } catch (error) {
    logger.error('Admin auth middleware error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.admin.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Access denied for role ${userRole}, required: ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Super admin only
const requireSuperAdmin = requireRole('super_admin');

// Admin or Super Admin
const requireAdmin = requireRole(['admin', 'super_admin']);

// Any admin role
const requireAnyAdmin = requireRole(['editor', 'admin', 'super_admin']);

module.exports = {
  adminAuth,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  requireAnyAdmin
};
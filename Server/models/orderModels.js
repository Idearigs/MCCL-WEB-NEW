const { DataTypes } = require('sequelize');
const { postgresDB } = require('../config/database');

let Order, OrderItem;

const initializeOrderModels = () => {
  const sequelize = postgresDB();

  if (!sequelize) {
    throw new Error('Database connection not available');
  }

  /**
   * Order Model - Stores payment and order information
   */
  Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Human-readable order number (e.g., ORD-1234567890)'
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    customer_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    customer_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
      defaultValue: 'pending',
      comment: 'Order fulfillment status'
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'processing', 'paid', 'failed', 'cancelled', 'requires_action'),
      defaultValue: 'pending',
      comment: 'Payment status'
    },
    payment_method: {
      type: DataTypes.STRING(50),
      defaultValue: 'stripe',
      comment: 'Payment method (stripe, paypal, etc.)'
    },
    stripe_payment_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      comment: 'Stripe payment intent ID'
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Total order amount in GBP'
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0
    },
    shipping_cost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'GBP',
      comment: 'Currency code (ISO 4217)'
    },
    shipping_address: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Full shipping address as JSON'
    },
    billing_address: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Full billing address as JSON'
    },
    shipping_method: {
      type: DataTypes.STRING(100),
      defaultValue: 'standard',
      allowNull: true
    },
    tracking_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Internal notes about the order'
    },
    customer_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Customer-provided notes'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'Customer IP address for fraud detection'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Customer browser user agent'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    shipped_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'orders',
    indexes: [
      { fields: ['customer_email'] },
      { fields: ['stripe_payment_id'] },
      { fields: ['order_number'] },
      { fields: ['status'] },
      { fields: ['payment_status'] },
      { fields: ['created_at'] }
    ]
  });

  /**
   * OrderItem Model - Individual items in an order
   */
  OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Reference to Product'
    },
    product_variant_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Reference to ProductVariant'
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Product name snapshot at purchase time'
    },
    product_sku: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Price per unit at time of purchase'
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'quantity × unit_price'
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0
    },
    attributes: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Product attributes (size, color, metal, etc.)'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'order_items',
    indexes: [
      { fields: ['order_id'] },
      { fields: ['product_id'] }
    ]
  });

  // Set up associations after models are defined
  setupOrderAssociations();

  return { Order, OrderItem };
};

const setupOrderAssociations = () => {
  // Order associations
  Order.hasMany(OrderItem, {
    foreignKey: 'order_id',
    as: 'items',
    onDelete: 'CASCADE'
  });

  // OrderItem associations
  OrderItem.belongsTo(Order, {
    foreignKey: 'order_id',
    as: 'order'
  });

  // If Product model exists, add association
  try {
    const { getModelInstance } = require('./index');
    const { Product } = getModelInstance();
    if (Product) {
      OrderItem.belongsTo(Product, {
        foreignKey: 'product_id',
        as: 'product'
      });
    }
  } catch (error) {
    // Product model might not be initialized yet
  }
};

const getOrderModels = () => {
  return {
    Order,
    OrderItem
  };
};

module.exports = {
  initializeOrderModels,
  getOrderModels
};

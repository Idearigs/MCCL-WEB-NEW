const { DataTypes } = require('sequelize');
const { postgresDB } = require('../config/database');

let JewelryType, JewelrySubType, EarringType, NecklaceType, BraceletType;

const initializeJewelryModels = () => {
  const sequelize = postgresDB();

  if (!sequelize) {
    throw new Error('Database connection not available');
  }

  // =====================================================
  // JewelryTypes Model - Main jewelry categories (Rings, Earrings, Necklaces, Bracelets)
  // =====================================================
  JewelryType = sequelize.define('JewelryType', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    icon: {
      type: DataTypes.STRING(50),
      comment: 'Icon name for UI display (e.g., Circle, Sparkles, Link, Watch)'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'jewelry_types',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['slug'] },
      { fields: ['is_active'] }
    ]
  });

  // =====================================================
  // JewelrySubTypes Model - Ring subcategories (Engagement, Wedding)
  // =====================================================
  JewelrySubType = sequelize.define('JewelrySubType', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    jewelry_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'jewelry_types',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    image_url: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'jewelry_sub_types',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['jewelry_type_id'] },
      { fields: ['slug'] },
      { fields: ['is_active'] },
      {
        unique: true,
        fields: ['jewelry_type_id', 'name']
      }
    ]
  });

  // =====================================================
  // EarringTypes Model - Types of earrings (Studs, Hoops, Drops, etc.)
  // =====================================================
  EarringType = sequelize.define('EarringType', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'earring_types',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['slug'] },
      { fields: ['is_active'] }
    ]
  });

  // =====================================================
  // NecklaceTypes Model - Types of necklaces (Pendants, Chains, Chokers, etc.)
  // =====================================================
  NecklaceType = sequelize.define('NecklaceType', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'necklace_types',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['slug'] },
      { fields: ['is_active'] }
    ]
  });

  // =====================================================
  // BraceletTypes Model - Types of bracelets (Bangles, Chains, Cuffs, etc.)
  // =====================================================
  BraceletType = sequelize.define('BraceletType', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'bracelet_types',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['slug'] },
      { fields: ['is_active'] }
    ]
  });

  // =====================================================
  // Define Associations
  // =====================================================

  // JewelryType has many JewelrySubTypes
  JewelryType.hasMany(JewelrySubType, {
    foreignKey: 'jewelry_type_id',
    as: 'subTypes'
  });

  JewelrySubType.belongsTo(JewelryType, {
    foreignKey: 'jewelry_type_id',
    as: 'jewelryType'
  });

  return {
    JewelryType,
    JewelrySubType,
    EarringType,
    NecklaceType,
    BraceletType
  };
};

const getJewelryModels = () => {
  return {
    JewelryType,
    JewelrySubType,
    EarringType,
    NecklaceType,
    BraceletType
  };
};

module.exports = {
  initializeJewelryModels,
  getJewelryModels
};

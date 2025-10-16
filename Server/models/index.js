const { DataTypes } = require('sequelize');
const { postgresDB } = require('../config/database');

let Category, Product, ProductImage, ProductVideo, ProductVariant, ProductMetals, ProductSizes, Collection, RingTypes, Gemstones, ProductRingTypes, ProductGemstones, ProductMetalsJunction;

const initializeModels = () => {
  const sequelize = postgresDB();

  if (!sequelize) {
    throw new Error('Database connection not available');
  }

  // Initialize admin models first
  const { initializeAdminModels } = require('./adminModels');
  initializeAdminModels();

  // Initialize watch models
  const { initializeWatchModels } = require('./watchModels');
  initializeWatchModels();

  // Initialize jewelry models
  const { initializeJewelryModels } = require('./jewelryModels');
  initializeJewelryModels();

  // Categories Model - Now supports hierarchical structure
  Category = sequelize.define('Category', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    category_type: {
      type: DataTypes.ENUM('main', 'sub_type', 'sub_gemstone', 'sub_metal', 'sub_eternity'),
      allowNull: false,
      defaultValue: 'main'
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '0=main, 1=subcategory, 2=sub-subcategory'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    meta_title: {
      type: DataTypes.STRING(200)
    },
    meta_description: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'categories',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['parent_id']
      },
      {
        fields: ['category_type']
      },
      {
        fields: ['level']
      },
      {
        unique: true,
        fields: ['name', 'parent_id']
      }
    ]
  });

  // Collections Model
  Collection = sequelize.define('Collection', {
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
    image_url: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'collections',
    underscored: true,
    timestamps: true
  });

  // Products Model
  Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    short_description: {
      type: DataTypes.TEXT
    },
    sku: {
      type: DataTypes.STRING(100),
      unique: true
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    sale_price: {
      type: DataTypes.DECIMAL(10, 2)
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'GBP'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    in_stock: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    weight: {
      type: DataTypes.DECIMAL(8, 3)
    },
    dimensions: {
      type: DataTypes.JSONB
    },
    care_instructions: {
      type: DataTypes.TEXT
    },
    warranty_info: {
      type: DataTypes.TEXT
    },
    meta_title: {
      type: DataTypes.STRING(200)
    },
    meta_description: {
      type: DataTypes.TEXT
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    category_id: {
      type: DataTypes.UUID,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    collection_id: {
      type: DataTypes.UUID,
      references: {
        model: 'collections',
        key: 'id'
      }
    },
    ring_type_id: {
      type: DataTypes.UUID,
      references: {
        model: 'ring_types',
        key: 'id'
      }
    },
    gemstone_id: {
      type: DataTypes.UUID,
      references: {
        model: 'gemstones',
        key: 'id'
      }
    },
    metal_id: {
      type: DataTypes.UUID,
      references: {
        model: 'product_metals',
        key: 'id'
      }
    }
  }, {
    tableName: 'products',
    underscored: true,
    timestamps: true
  });

  // Product Images Model
  ProductImage = sequelize.define('ProductImage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    alt_text: {
      type: DataTypes.STRING(255)
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'product_images',
    underscored: true,
    timestamps: true
  });

  // Product Videos Model
  ProductVideo = sequelize.define('ProductVideo', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    video_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255)
    },
    description: {
      type: DataTypes.TEXT
    },
    duration: {
      type: DataTypes.INTEGER
    },
    thumbnail_url: {
      type: DataTypes.STRING(500)
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'product_videos',
    underscored: true,
    timestamps: true
  });

  // Product Variants Model (for different metals, sizes, etc.)
  ProductVariant = sequelize.define('ProductVariant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    variant_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING(100),
      unique: true
    },
    price_adjustment: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    metal_type: {
      type: DataTypes.STRING(50)
    },
    metal_color: {
      type: DataTypes.STRING(7)
    },
    size: {
      type: DataTypes.STRING(20)
    },
    gemstone_type: {
      type: DataTypes.STRING(50)
    },
    gemstone_carat: {
      type: DataTypes.DECIMAL(5, 2)
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'product_variants',
    underscored: true,
    timestamps: true
  });

  // Product Metals Model (Available metals for products)
  ProductMetals = sequelize.define('ProductMetals', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    color_code: {
      type: DataTypes.STRING(7),
      allowNull: false
    },
    price_multiplier: {
      type: DataTypes.DECIMAL(5, 4),
      defaultValue: 1.0000
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
    tableName: 'product_metals',
    underscored: true,
    timestamps: true
  });

  // Ring Types Model (for ring categorization)
  RingTypes = sequelize.define('RingTypes', {
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
    tableName: 'ring_types',
    underscored: true,
    timestamps: true
  });

  // Gemstones Model (for gemstone categorization)
  Gemstones = sequelize.define('Gemstones', {
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
    color: {
      type: DataTypes.STRING(50)
    },
    hardness: {
      type: DataTypes.DECIMAL(3, 1)
    },
    price_per_carat: {
      type: DataTypes.DECIMAL(10, 2)
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
    tableName: 'gemstones',
    underscored: true,
    timestamps: true
  });

  // Product Sizes Model (Available sizes for products)
  ProductSizes = sequelize.define('ProductSizes', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    size_name: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    size_value: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    category_id: {
      type: DataTypes.UUID,
      references: {
        model: 'categories',
        key: 'id'
      }
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
    tableName: 'product_sizes',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['size_name', 'size_value', 'category_id']
      }
    ]
  });

  // Junction Tables for Many-to-Many Relationships

  // Product Ring Types Junction
  ProductRingTypes = sequelize.define('ProductRingTypes', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    ring_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'ring_types',
        key: 'id'
      }
    }
  }, {
    tableName: 'product_ring_types',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['product_id', 'ring_type_id']
      }
    ]
  });

  // Product Gemstones Junction
  ProductGemstones = sequelize.define('ProductGemstones', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    gemstone_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'gemstones',
        key: 'id'
      }
    }
  }, {
    tableName: 'product_gemstones',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['product_id', 'gemstone_id']
      }
    ]
  });

  // Product Metals Junction
  ProductMetalsJunction = sequelize.define('ProductMetalsJunction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    metal_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'product_metals',
        key: 'id'
      }
    }
  }, {
    tableName: 'product_metals_junction',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['product_id', 'metal_id']
      }
    ]
  });

  // Define Associations

  // Self-referencing hierarchy for categories
  Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
  Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

  // Product associations
  Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
  Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

  Collection.hasMany(Product, { foreignKey: 'collection_id', as: 'products' });
  Product.belongsTo(Collection, { foreignKey: 'collection_id', as: 'collection' });

  Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
  ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  Product.hasMany(ProductVideo, { foreignKey: 'product_id', as: 'videos' });
  ProductVideo.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
  ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  Category.hasMany(ProductSizes, { foreignKey: 'category_id', as: 'sizes' });
  ProductSizes.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

  // Ring-specific associations (keeping for backward compatibility)
  RingTypes.hasMany(Product, { foreignKey: 'ring_type_id', as: 'products' });
  Product.belongsTo(RingTypes, { foreignKey: 'ring_type_id', as: 'ringType' });

  Gemstones.hasMany(Product, { foreignKey: 'gemstone_id', as: 'products' });
  Product.belongsTo(Gemstones, { foreignKey: 'gemstone_id', as: 'gemstone' });

  ProductMetals.hasMany(Product, { foreignKey: 'metal_id', as: 'products' });
  Product.belongsTo(ProductMetals, { foreignKey: 'metal_id', as: 'metal' });

  // Many-to-Many Associations through Junction Tables
  Product.belongsToMany(RingTypes, {
    through: ProductRingTypes,
    foreignKey: 'product_id',
    otherKey: 'ring_type_id',
    as: 'ringTypes'
  });
  RingTypes.belongsToMany(Product, {
    through: ProductRingTypes,
    foreignKey: 'ring_type_id',
    otherKey: 'product_id',
    as: 'ringTypeProducts'
  });

  Product.belongsToMany(Gemstones, {
    through: ProductGemstones,
    foreignKey: 'product_id',
    otherKey: 'gemstone_id',
    as: 'gemstones'
  });
  Gemstones.belongsToMany(Product, {
    through: ProductGemstones,
    foreignKey: 'gemstone_id',
    otherKey: 'product_id',
    as: 'gemstoneProducts'
  });

  Product.belongsToMany(ProductMetals, {
    through: ProductMetalsJunction,
    foreignKey: 'product_id',
    otherKey: 'metal_id',
    as: 'metals'
  });
  ProductMetals.belongsToMany(Product, {
    through: ProductMetalsJunction,
    foreignKey: 'metal_id',
    otherKey: 'product_id',
    as: 'metalProducts'
  });

  // Get watch models
  const { getWatchModels } = require('./watchModels');
  const watchModels = getWatchModels();

  // Get jewelry models
  const { getJewelryModels } = require('./jewelryModels');
  const jewelryModels = getJewelryModels();

  return {
    Category,
    Collection,
    Product,
    ProductImage,
    ProductVideo,
    ProductVariant,
    ProductMetals,
    ProductSizes,
    RingTypes,
    Gemstones,
    ProductRingTypes,
    ProductGemstones,
    ProductMetalsJunction,
    ...watchModels,
    ...jewelryModels
  };
};

module.exports = {
  initializeModels,
  getModels: () => {
    const { getWatchModels } = require('./watchModels');
    const watchModels = getWatchModels();

    const { getJewelryModels } = require('./jewelryModels');
    const jewelryModels = getJewelryModels();

    return {
      Category,
      Collection,
      Product,
      ProductImage,
      ProductVideo,
      ProductVariant,
      ProductMetals,
      ProductSizes,
      RingTypes,
      Gemstones,
      ProductRingTypes,
      ProductGemstones,
      ProductMetalsJunction,
      ...watchModels,
      ...jewelryModels
    };
  }
};
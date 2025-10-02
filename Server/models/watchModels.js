const { DataTypes } = require('sequelize');
const { postgresDB } = require('../config/database');

let WatchBrand, WatchCollection, Watch, WatchImage, WatchSpecification, WatchVariant, WatchBrandCollections;

const initializeWatchModels = () => {
  const sequelize = postgresDB();

  if (!sequelize) {
    throw new Error('Database connection not available');
  }

  // Watch Brands Model (Festina, Briston, Roamer)
  WatchBrand = sequelize.define('WatchBrand', {
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
    logo_url: {
      type: DataTypes.TEXT
    },
    website_url: {
      type: DataTypes.TEXT
    },
    founded_year: {
      type: DataTypes.INTEGER
    },
    country_origin: {
      type: DataTypes.STRING(100)
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
      type: DataTypes.STRING(255)
    },
    meta_description: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'watch_brands',
    timestamps: true,
    underscored: true
  });

  // Watch Collections Model (Per Brand)
  WatchCollection = sequelize.define('WatchCollection', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    brand_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'watch_brands',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    image_url: {
      type: DataTypes.TEXT
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    launch_year: {
      type: DataTypes.INTEGER
    },
    target_audience: {
      type: DataTypes.ENUM('men', 'women', 'unisex', 'children'),
      defaultValue: 'unisex'
    }
  }, {
    tableName: 'watch_collections',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['brand_id', 'slug']
      }
    ]
  });

  // Main Watches Model
  Watch = sequelize.define('Watch', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    brand_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'watch_brands',
        key: 'id'
      }
    },
    collection_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'watch_collections',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true
    },
    model_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    short_description: {
      type: DataTypes.TEXT
    },
    description: {
      type: DataTypes.TEXT
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    sale_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'GBP'
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    gender: {
      type: DataTypes.ENUM('men', 'women', 'unisex', 'children'),
      defaultValue: 'unisex'
    },
    watch_type: {
      type: DataTypes.ENUM('analog', 'digital', 'hybrid', 'smart'),
      defaultValue: 'analog'
    },
    style: {
      type: DataTypes.ENUM('dress', 'sport', 'casual', 'luxury', 'diving', 'aviation', 'military'),
      defaultValue: 'casual'
    },
    warranty_years: {
      type: DataTypes.INTEGER,
      defaultValue: 2
    },
    care_instructions: {
      type: DataTypes.TEXT
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    in_stock: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    meta_title: {
      type: DataTypes.STRING(255)
    },
    meta_description: {
      type: DataTypes.TEXT
    },
    availability_status: {
      type: DataTypes.ENUM('in_stock', 'low_stock', 'out_of_stock', 'pre_order', 'discontinued'),
      defaultValue: 'in_stock'
    }
  }, {
    tableName: 'watches',
    timestamps: true,
    underscored: true
  });

  // Watch Images Model
  WatchImage = sequelize.define('WatchImage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    watch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'watches',
        key: 'id'
      }
    },
    image_url: {
      type: DataTypes.TEXT,
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
    },
    image_type: {
      type: DataTypes.ENUM('product', 'lifestyle', 'detail', 'packaging'),
      defaultValue: 'product'
    }
  }, {
    tableName: 'watch_images',
    timestamps: true,
    underscored: true
  });

  // Watch Specifications Model
  WatchSpecification = sequelize.define('WatchSpecification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    watch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'watches',
        key: 'id'
      }
    },
    movement: {
      type: DataTypes.STRING(100) // Quartz, Automatic, Manual, etc.
    },
    case_material: {
      type: DataTypes.STRING(100) // Stainless Steel, Gold, Titanium, etc.
    },
    case_diameter: {
      type: DataTypes.STRING(50) // e.g., "42mm"
    },
    case_thickness: {
      type: DataTypes.STRING(50) // e.g., "12mm"
    },
    dial_color: {
      type: DataTypes.STRING(50)
    },
    crystal_material: {
      type: DataTypes.STRING(100) // Sapphire, Mineral, etc.
    },
    strap_material: {
      type: DataTypes.STRING(100) // Leather, Steel, Rubber, etc.
    },
    strap_color: {
      type: DataTypes.STRING(50)
    },
    water_resistance: {
      type: DataTypes.STRING(50) // e.g., "50m", "100m", "200m"
    },
    weight: {
      type: DataTypes.STRING(50) // e.g., "150g"
    },
    power_reserve: {
      type: DataTypes.STRING(50) // For automatic watches, e.g., "42 hours"
    },
    complications: {
      type: DataTypes.TEXT // Date, Chronograph, GMT, etc.
    },
    lug_width: {
      type: DataTypes.STRING(50) // e.g., "20mm"
    },
    buckle_type: {
      type: DataTypes.STRING(100) // Deployment, Pin, etc.
    }
  }, {
    tableName: 'watch_specifications',
    timestamps: true,
    underscored: true
  });

  // Watch Variants Model (Different straps, sizes, etc.)
  WatchVariant = sequelize.define('WatchVariant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    watch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'watches',
        key: 'id'
      }
    },
    variant_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    price_adjustment: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    size: {
      type: DataTypes.STRING(50) // Different case sizes
    },
    strap_type: {
      type: DataTypes.STRING(100) // Different strap options
    },
    strap_color: {
      type: DataTypes.STRING(50)
    },
    dial_variant: {
      type: DataTypes.STRING(100) // Different dial colors/styles
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
    tableName: 'watch_variants',
    timestamps: true,
    underscored: true
  });

  // Define Relationships

  // Brand -> Collections (One to Many)
  WatchBrand.hasMany(WatchCollection, {
    foreignKey: 'brand_id',
    as: 'collections'
  });
  WatchCollection.belongsTo(WatchBrand, {
    foreignKey: 'brand_id',
    as: 'brand'
  });

  // Brand -> Watches (One to Many)
  WatchBrand.hasMany(Watch, {
    foreignKey: 'brand_id',
    as: 'watches'
  });
  Watch.belongsTo(WatchBrand, {
    foreignKey: 'brand_id',
    as: 'brand'
  });

  // Collection -> Watches (One to Many)
  WatchCollection.hasMany(Watch, {
    foreignKey: 'collection_id',
    as: 'watches'
  });
  Watch.belongsTo(WatchCollection, {
    foreignKey: 'collection_id',
    as: 'collection'
  });

  // Watch -> Images (One to Many)
  Watch.hasMany(WatchImage, {
    foreignKey: 'watch_id',
    as: 'images'
  });
  WatchImage.belongsTo(Watch, {
    foreignKey: 'watch_id',
    as: 'watch'
  });

  // Watch -> Specifications (One to One)
  Watch.hasOne(WatchSpecification, {
    foreignKey: 'watch_id',
    as: 'specifications'
  });
  WatchSpecification.belongsTo(Watch, {
    foreignKey: 'watch_id',
    as: 'watch'
  });

  // Watch -> Variants (One to Many)
  Watch.hasMany(WatchVariant, {
    foreignKey: 'watch_id',
    as: 'variants'
  });
  WatchVariant.belongsTo(Watch, {
    foreignKey: 'watch_id',
    as: 'watch'
  });

  console.log('Watch models initialized successfully');
};

const getWatchModels = () => {
  return {
    WatchBrand,
    WatchCollection,
    Watch,
    WatchImage,
    WatchSpecification,
    WatchVariant
  };
};

module.exports = {
  initializeWatchModels,
  getWatchModels
};
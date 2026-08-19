const { DataTypes } = require('sequelize');

let Category, Product, ProductImage, ProductVideo, ProductVariant, ProductMetals, ProductSizes, Collection, RingTypes, StoneShapes, StoneTypes, ProductRingTypes, ProductStoneShapes, ProductStoneTypes, ProductMetalsJunction, MarketingContent, Promotion, Chat, ChatMessage, DiamondSizes, ProductDiamondSizes, ChatLabel, ChatLabelAssignment, ProductRingSpecs, ProductSideStones, ProductPricingConfig, Review;

// Accepts the sequelize instance directly so models never need to require config/database
const initializeModels = (sequelize) => {
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

  // Initialize order models
  const { initializeOrderModels } = require('./orderModels');
  const { Order, OrderItem } = initializeOrderModels();

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
    // Live stock: a ready-made, ready-to-ship piece (as opposed to made-to-order)
    is_live_stock: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this product is ready-made live stock (ready to ship)'
    },
    // Made on Request fields
    is_made_on_request: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this product is made to order/request'
    },
    made_on_request_lead_time: {
      type: DataTypes.STRING(100),
      defaultValue: '4-6 weeks',
      comment: 'Expected lead time for made-on-request products'
    },
    made_on_request_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Custom message to display for made-on-request products'
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
    // Nivoda Integration Fields
    nivoda_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    show_stone_type: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    show_carat: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    show_clarity: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    show_colour: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    show_cut: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    show_certificate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    certificate: {
      type: DataTypes.STRING(255)
    },
    nivoda_options_config: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: 'Nivoda configuration: {stoneType, caratRange, clarityOptions, colourOptions, cutOptions}'
    },
    ring_styles: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Ring style tags: Solitaire, Halo, Vintage, Shoulder Set, etc.'
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
    metal_id: {
      type: DataTypes.UUID,
      references: {
        model: 'product_metals',
        key: 'id'
      }
    },
    jewelry_sub_type_id: {
      type: DataTypes.UUID,
      references: {
        model: 'jewelry_sub_types',
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
    metal_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'product_metals',
        key: 'id'
      },
      comment: 'Optional: Link image to specific metal/material type'
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
    is_metal_preview: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Flag to mark image as the preview image for a specific metal'
    },
    diamond_size_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'diamond_sizes',
        key: 'id'
      },
      comment: 'Optional: Link image to specific diamond size'
    },
    is_diamond_size_preview: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Flag to mark image as the preview image for a specific diamond size'
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
    metal_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'product_metals',
        key: 'id'
      },
      comment: 'Optional: Link video to specific metal/material type'
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
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    carat_weight: {
      type: DataTypes.DECIMAL(5, 3),
      allowNull: true
    },
    mm_width: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    metal_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'product_metals', key: 'id' }
    },
    ai_description: {
      type: DataTypes.TEXT,
      allowNull: true
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

  // Marketing Content Model (for special product/design releases)
  MarketingContent = sequelize.define('MarketingContent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id'
      },
      comment: 'Link to featured product (optional)'
    },
    video_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'YouTube or video URL'
    },
    thumbnail_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Thumbnail/background image for the section'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Featured on home page'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'marketing_content',
    underscored: true,
    timestamps: true
  });

  // Promotion/Special Deals Model
  Promotion = sequelize.define('Promotion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id'
      },
      comment: 'Featured product in popup'
    },
    discount_percentage: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Discount percentage for banner'
    },
    banner_text: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Text to display in marquee banner'
    },
    banner_text_1: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'First banner text item'
    },
    banner_text_2: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Second banner text item'
    },
    banner_text_3: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Third banner text item'
    },
    banner_text_4: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Fourth banner text item'
    },
    banner_text_5: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Fifth banner text item'
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Image for popup'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    show_popup: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Show in popup modal'
    },
    show_banner: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Show in marquee banner'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'promotions',
    underscored: true,
    timestamps: true
  });

  // Reviews Model — customer testimonials (admin-added and visitor-submitted).
  // `source` and `status` are plain strings (validated in the controller) so the
  // dev sync and the production SQL migration produce identical column types.
  Review = sequelize.define('Review', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    author_name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: 'Optional town/city or context shown under the quote'
    },
    category: {
      type: DataTypes.STRING(60),
      allowNull: true,
      comment: 'e.g. Bespoke, Engagement, Servicing — the small label beside the name'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      comment: '1–5 stars'
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'The review / quote text'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Visitor email for follow-up — never shown publicly'
    },
    source: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'admin',
      comment: 'admin = staff-added, visitor = submitted via the site form'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'published',
      comment: 'pending | published | hidden'
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Show in the homepage "What clients say" section'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'reviews',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['source'] },
      { fields: ['is_featured'] }
    ]
  });

  // Chat Model - for storing chat sessions
  Chat = sequelize.define('Chat', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    customer_email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    customer_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Null for anonymous, UUID for logged-in users'
    },
    assigned_admin_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'admin_users',
        key: 'id'
      },
      comment: 'Admin user assigned to handle this chat'
    },
    status: {
      type: DataTypes.ENUM('active', 'closed', 'waiting'),
      defaultValue: 'waiting',
      comment: 'active=being handled, closed=ended, waiting=waiting for admin'
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'chats',
    underscored: true,
    timestamps: true
  });

  // ChatMessage Model - for storing individual chat messages
  ChatMessage = sequelize.define('ChatMessage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    chat_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chats',
        key: 'id'
      }
    },
    sender_type: {
      type: DataTypes.ENUM('customer', 'admin'),
      allowNull: false
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Can be customer user ID or admin user ID'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    attachment_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'chat_messages',
    underscored: true,
    timestamps: true
  });

  // Chat Labels Model - for categorizing chats with color-coded labels
  ChatLabel = sequelize.define('ChatLabel', {
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
    color: {
      type: DataTypes.STRING(7),
      allowNull: false,
      comment: 'Hex color code e.g. #ef4444'
    }
  }, {
    tableName: 'chat_labels',
    underscored: true,
    timestamps: true
  });

  // Chat Label Assignments Junction - links chats to labels
  ChatLabelAssignment = sequelize.define('ChatLabelAssignment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    chat_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chats',
        key: 'id'
      }
    },
    label_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chat_labels',
        key: 'id'
      }
    }
  }, {
    tableName: 'chat_label_assignments',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['chat_id', 'label_id']
      }
    ]
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

  // Stone Shapes Model (for stone shape categorization)
  StoneShapes = sequelize.define('StoneShapes', {
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
    tableName: 'stone_shapes',
    underscored: true,
    timestamps: true
  });

  // Stone Types Model (for stone type categorization - Natural Diamond, Lab Grown, etc.)
  StoneTypes = sequelize.define('StoneTypes', {
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
    tableName: 'stone_types',
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

  // Product Stone Shapes Junction
  ProductStoneShapes = sequelize.define('ProductStoneShapes', {
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
    stone_shape_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'stone_shapes',
        key: 'id'
      }
    }
  }, {
    tableName: 'product_stone_shapes',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['product_id', 'stone_shape_id']
      }
    ]
  });

  // Product Stone Types Junction (Gemstones)
  ProductStoneTypes = sequelize.define('ProductStoneTypes', {
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
    stone_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'stone_types',
        key: 'id'
      }
    }
  }, {
    tableName: 'product_stone_types',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['product_id', 'stone_type_id']
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
    },
    mount_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null
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

  // Diamond Sizes Model (for Engagement Rings)
  DiamondSizes = sequelize.define('DiamondSizes', {
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
    display_name: {
      type: DataTypes.STRING(100)
    },
    description: {
      type: DataTypes.TEXT
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'diamond_sizes',
    underscored: true,
    timestamps: true
  });

  // Product Diamond Sizes Junction (many-to-many)
  ProductDiamondSizes = sequelize.define('ProductDiamondSizes', {
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
    diamond_size_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'diamond_sizes',
        key: 'id'
      }
    }
  }, {
    tableName: 'product_diamond_sizes',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['product_id', 'diamond_size_id']
      }
    ]
  });

  // ── Ring Specs & Pricing Models ──────────────────────────────────────────

  ProductRingSpecs = sequelize.define('ProductRingSpecs', {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    product_id:   { type: DataTypes.UUID, allowNull: false },
    silver_wt:    DataTypes.DECIMAL(8, 3),
    gold_9kt_wt:  DataTypes.DECIMAL(8, 3),
    gold_14kt_wt: DataTypes.DECIMAL(8, 3),
    gold_18kt_wt: DataTypes.DECIMAL(8, 3),
    platinum_wt:  DataTypes.DECIMAL(8, 3),
    cs1_shape:    DataTypes.STRING(50),
    cs1_size:     DataTypes.STRING(50),
    cs1_carats:   DataTypes.DECIMAL(8, 4),
    cs1_pieces:   DataTypes.INTEGER,
    cs2_shape:    DataTypes.STRING(50),
    cs2_size:     DataTypes.STRING(50),
    cs2_carats:   DataTypes.DECIMAL(8, 4),
    cs2_pieces:   DataTypes.INTEGER,
    stone_shape:  DataTypes.STRING(50),
    stone_type:   DataTypes.STRING(50),
    ring_styles:  DataTypes.TEXT,
  }, { tableName: 'product_ring_specs', underscored: true, timestamps: true });

  ProductSideStones = sequelize.define('ProductSideStones', {
    id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    product_id: { type: DataTypes.UUID, allowNull: false },
    shape:      DataTypes.STRING(100),
    dimensions: DataTypes.STRING(50),
    pieces:     DataTypes.INTEGER,
    carats:     DataTypes.DECIMAL(8, 4),
    raw_entry:  DataTypes.TEXT,
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  }, { tableName: 'product_side_stones', underscored: true, timestamps: true });

  ProductPricingConfig = sequelize.define('ProductPricingConfig', {
    id:                     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    product_id:             { type: DataTypes.UUID, allowNull: false },
    metal_premium_pct:      { type: DataTypes.DECIMAL(5, 2), defaultValue: 5.00 },
    side_stone_rate_per_ct: { type: DataTypes.DECIMAL(8, 2), defaultValue: 500.00 },
    diamond_rate_per_ct:    { type: DataTypes.DECIMAL(10, 2), defaultValue: 2000.00 },
    margin_type:            { type: DataTypes.STRING(10), defaultValue: 'percent' },
    margin_value:           { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    calculated_prices:      DataTypes.JSONB,
    price_overrides:        DataTypes.JSONB,
    last_calculated_at:     DataTypes.DATE,
  }, { tableName: 'product_pricing_config', underscored: true, timestamps: true });

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

  // Metal-specific image relationships
  ProductMetals.hasMany(ProductImage, { foreignKey: 'metal_id', as: 'images' });
  ProductImage.belongsTo(ProductMetals, { foreignKey: 'metal_id', as: 'metal' });

  // Diamond size-specific image relationships
  DiamondSizes.hasMany(ProductImage, { foreignKey: 'diamond_size_id', as: 'images' });
  ProductImage.belongsTo(DiamondSizes, { foreignKey: 'diamond_size_id', as: 'diamondSize' });

  Product.hasMany(ProductVideo, { foreignKey: 'product_id', as: 'videos' });
  ProductVideo.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // Metal-specific video relationships
  ProductMetals.hasMany(ProductVideo, { foreignKey: 'metal_id', as: 'videos' });
  ProductVideo.belongsTo(ProductMetals, { foreignKey: 'metal_id', as: 'metal' });

  Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
  ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  Category.hasMany(ProductSizes, { foreignKey: 'category_id', as: 'sizes' });
  ProductSizes.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

  // Metal associations
  ProductMetals.hasMany(Product, { foreignKey: 'metal_id', as: 'products' });
  Product.belongsTo(ProductMetals, { foreignKey: 'metal_id', as: 'metal' });

  // ProductVariant → ProductMetals association
  ProductVariant.belongsTo(ProductMetals, { foreignKey: 'metal_id', as: 'metal' });
  ProductMetals.hasMany(ProductVariant, { foreignKey: 'metal_id', as: 'variants' });

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

  Product.belongsToMany(StoneShapes, {
    through: ProductStoneShapes,
    foreignKey: 'product_id',
    otherKey: 'stone_shape_id',
    as: 'stoneShapes'
  });
  StoneShapes.belongsToMany(Product, {
    through: ProductStoneShapes,
    foreignKey: 'stone_shape_id',
    otherKey: 'product_id',
    as: 'stoneShapeProducts'
  });

  Product.belongsToMany(StoneTypes, {
    through: ProductStoneTypes,
    foreignKey: 'product_id',
    otherKey: 'stone_type_id',
    as: 'gemstones'
  });
  StoneTypes.belongsToMany(Product, {
    through: ProductStoneTypes,
    foreignKey: 'stone_type_id',
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

  // Diamond Size associations (for Engagement Rings)
  Product.belongsToMany(DiamondSizes, {
    through: ProductDiamondSizes,
    foreignKey: 'product_id',
    otherKey: 'diamond_size_id',
    as: 'diamondSizes'
  });
  DiamondSizes.belongsToMany(Product, {
    through: ProductDiamondSizes,
    foreignKey: 'diamond_size_id',
    otherKey: 'product_id',
    as: 'diamondSizeProducts'
  });

  // Marketing Content associations
  MarketingContent.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  Product.hasMany(MarketingContent, { foreignKey: 'product_id', as: 'marketingContent' });

  // Promotion associations
  Promotion.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  Product.hasMany(Promotion, { foreignKey: 'product_id', as: 'promotions' });

  // Chat associations
  Chat.hasMany(ChatMessage, { foreignKey: 'chat_id', as: 'messages', onDelete: 'CASCADE' });
  ChatMessage.belongsTo(Chat, { foreignKey: 'chat_id', as: 'chat' });

  // Chat Label associations
  Chat.hasMany(ChatLabelAssignment, { foreignKey: 'chat_id', as: 'labelAssignments', onDelete: 'CASCADE' });
  ChatLabelAssignment.belongsTo(Chat, { foreignKey: 'chat_id', as: 'chat' });
  ChatLabel.hasMany(ChatLabelAssignment, { foreignKey: 'label_id', as: 'assignments', onDelete: 'CASCADE' });
  ChatLabelAssignment.belongsTo(ChatLabel, { foreignKey: 'label_id', as: 'label' });

  // Ring specs + pricing associations
  Product.hasOne(ProductRingSpecs,    { foreignKey: 'product_id', as: 'ringSpecs' });
  ProductRingSpecs.belongsTo(Product, { foreignKey: 'product_id' });

  Product.hasMany(ProductSideStones,    { foreignKey: 'product_id', as: 'sideStones' });
  ProductSideStones.belongsTo(Product,  { foreignKey: 'product_id' });

  Product.hasOne(ProductPricingConfig,    { foreignKey: 'product_id', as: 'pricingConfig' });
  ProductPricingConfig.belongsTo(Product, { foreignKey: 'product_id' });

  // Get admin models to establish Chat-AdminUser relationship
  const { getAdminModels } = require('./adminModels');
  const adminModels = getAdminModels();
  if (adminModels.AdminUser) {
    Chat.belongsTo(adminModels.AdminUser, { foreignKey: 'assigned_admin_id', as: 'assignedAdmin' });
    adminModels.AdminUser.hasMany(Chat, { foreignKey: 'assigned_admin_id', as: 'assignedChats' });
  }

  // Get watch models
  const { getWatchModels } = require('./watchModels');
  const watchModels = getWatchModels();

  // Get jewelry models
  const { getJewelryModels } = require('./jewelryModels');
  const jewelryModels = getJewelryModels();

  // Set up Product <-> JewelrySubType associations
  if (jewelryModels && jewelryModels.JewelrySubType) {
    jewelryModels.JewelrySubType.hasMany(Product, { foreignKey: 'jewelry_sub_type_id', as: 'products' });
    Product.belongsTo(jewelryModels.JewelrySubType, { foreignKey: 'jewelry_sub_type_id', as: 'jewelrySubType' });
  }

  // Set up OrderItem <-> Product association (after all models are defined)
  const { getOrderModels } = require('./orderModels');
  const orderModelsRef = getOrderModels();
  if (orderModelsRef.OrderItem && Product && !orderModelsRef.OrderItem.associations?.product) {
    orderModelsRef.OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
    Product.hasMany(orderModelsRef.OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
  }

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
    StoneShapes,
    StoneTypes,
    ProductRingTypes,
    ProductStoneShapes,
    ProductStoneTypes,
    ProductMetalsJunction,
    MarketingContent,
    DiamondSizes,
    ProductDiamondSizes,
    ChatLabel,
    ChatLabelAssignment,
    ProductRingSpecs,
    ProductSideStones,
    ProductPricingConfig,
    Review,
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

    const { getOrderModels } = require('./orderModels');
    const orderModels = getOrderModels();

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
      StoneShapes,
      StoneTypes,
      ProductRingTypes,
      ProductStoneShapes,
      ProductStoneTypes,
      ProductMetalsJunction,
      MarketingContent,
      Promotion,
      Chat,
      ChatMessage,
      DiamondSizes,
      ProductDiamondSizes,
      ChatLabel,
      ChatLabelAssignment,
      ProductRingSpecs,
      ProductSideStones,
      ProductPricingConfig,
      Review,
      ...watchModels,
      ...jewelryModels,
      ...orderModels
    };
  }
};
const { Op } = require('sequelize');
const { getModels } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../config/database');

// Helper function to get models
const getModelInstance = () => {
  const models = getModels();
  if (!models.Category || !models.Collection || !models.Product || !models.ProductImage || !models.ProductVariant || !models.ProductMetals || !models.ProductSizes || !models.RingTypes || !models.Gemstones) {
    throw new Error('Models not initialized properly');
  }
  return models;
};

const getAllProducts = asyncHandler(async (req, res) => {
  try {
    const { Category, Collection, Product, ProductImage, ProductVariant, RingTypes, Gemstones, ProductMetals } = getModelInstance();
  const {
    category,
    collection,
    price_min,
    price_max,
    metal,
    gemstone,
    featured,
    in_stock,
    sort = 'created_at',
    order = 'desc',
    page = 1,
    limit = 12
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = { is_active: true };
  const include = [
    {
      model: Category,
      as: 'category',
      attributes: ['id', 'name', 'slug']
    },
    {
      model: Collection,
      as: 'collection',
      attributes: ['id', 'name', 'slug'],
      required: false
    },
    {
      model: ProductImage,
      as: 'images',
      attributes: ['id', 'image_url', 'alt_text', 'is_primary', 'sort_order'],
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
    },
    {
      model: ProductVariant,
      as: 'variants',
      attributes: ['id', 'variant_name', 'price_adjustment', 'metal_type', 'size', 'stock_quantity'],
      where: { is_active: true },
      required: false
    },
    {
      model: RingTypes,
      as: 'ringTypes',
      attributes: ['id', 'name', 'slug'],
      through: { attributes: [] },
      required: false
    },
    {
      model: ProductMetals,
      as: 'metals',
      attributes: ['id', 'name', 'color_code'],
      through: { attributes: [] },
      required: false
    },
    {
      model: Gemstones,
      as: 'gemstones',
      attributes: ['id', 'name', 'slug'],
      through: { attributes: [] },
      required: false
    }
  ];

  // Category filter
  if (category) {
    include[0].where = { slug: category };
    include[0].required = true;
  }

  // Collection filter
  if (collection) {
    include[1].where = { slug: collection };
    include[1].required = true;
  }

  // Price filters
  if (price_min || price_max) {
    if (price_min) whereClause.base_price = { [Op.gte]: price_min };
    if (price_max) {
      whereClause.base_price = {
        ...whereClause.base_price,
        [Op.lte]: price_max
      };
    }
  }

  // Other filters
  if (featured !== undefined) whereClause.is_featured = featured === 'true';
  if (in_stock !== undefined) whereClause.in_stock = in_stock === 'true';

  // Metal and gemstone filters (through variants)
  if (metal || gemstone) {
    const variantWhere = {};
    if (metal) variantWhere.metal_type = { [Op.iLike]: `%${metal}%` };
    if (gemstone) variantWhere.gemstone_type = { [Op.iLike]: `%${gemstone}%` };

    include[3].where = { ...include[3].where, ...variantWhere };
    include[3].required = true;
  }

  // Sorting
  const orderBy = [];
  if (sort === 'price') {
    orderBy.push(['base_price', order.toUpperCase()]);
  } else if (sort === 'name') {
    orderBy.push(['name', order.toUpperCase()]);
  } else if (sort === 'featured') {
    orderBy.push(['is_featured', 'DESC'], ['created_at', 'DESC']);
  } else if (sort === 'sort_order') {
    orderBy.push(['sort_order', order.toUpperCase()]);
  } else {
    orderBy.push(['created_at', order.toUpperCase()]);
  }

  const { count, rows: products } = await Product.findAndCountAll({
    where: whereClause,
    include,
    order: orderBy,
    limit: parseInt(limit),
    offset,
    distinct: true
  });

  // Transform response to match frontend expectations
  const transformedProducts = products.map(product => {
    const images = product.images || [];
    const primaryImage = images.find(img => img.is_primary) || images[0];
    const currentPrice = product.sale_price || product.base_price;

    return {
      id: product.id,
      name: product.name || '',
      slug: product.slug || '',
      price: currentPrice ? `£${parseFloat(currentPrice).toLocaleString()}` : '£0',
      base_price: product.base_price ? parseFloat(product.base_price) : 0,
      sale_price: product.sale_price ? parseFloat(product.sale_price) : null,
      currency: product.currency || 'GBP',
      description: product.short_description || product.description || '',
      category: product.category || null,
      collection: product.collection || null,
      ring_type: product.ringTypes && product.ringTypes.length > 0 ? product.ringTypes[0] : null,
      primary_metal: product.metals && product.metals.length > 0 ? product.metals[0] : null,
      gemstones: product.gemstones || [],
      is_featured: product.is_featured || false,
      in_stock: product.in_stock || false,
      image: primaryImage ? {
        url: primaryImage.image_url || '',
        alt: primaryImage.alt_text || product.name || ''
      } : null,
      images: images.map(img => ({
        id: img.id || '',
        url: img.image_url || '',
        alt: img.alt_text || '',
        is_primary: img.is_primary || false
      })),
      variants: product.variants || [],
      created_at: product.created_at
    };
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      products: transformedProducts,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: count,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    }
  });

  } catch (error) {
    logger.error('Error in getAllProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const { Category, Collection, Product, ProductImage, ProductVideo, ProductVariant, ProductMetals, ProductSizes, RingTypes, Gemstones } = getModelInstance();
  const { slug } = req.params;

  const product = await Product.findOne({
    where: { slug, is_active: true },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      },
      {
        model: Collection,
        as: 'collection',
        attributes: ['id', 'name', 'slug'],
        required: false
      },
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'image_url', 'alt_text', 'is_primary', 'sort_order'],
        order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
      },
      {
        model: ProductVideo,
        as: 'videos',
        attributes: ['id', 'video_url', 'title', 'description', 'sort_order'],
        order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
      },
      {
        model: ProductVariant,
        as: 'variants',
        attributes: ['id', 'variant_name', 'price_adjustment', 'metal_type', 'metal_color', 'size', 'gemstone_type', 'gemstone_carat', 'stock_quantity'],
        where: { is_active: true },
        required: false
      },
      {
        model: ProductMetals,
        as: 'metals',
        attributes: ['id', 'name', 'color_code'],
        required: false
      },
      {
        model: RingTypes,
        as: 'ringTypes',
        attributes: ['id', 'name', 'slug'],
        through: { attributes: [] },
        required: false
      },
      {
        model: Gemstones,
        as: 'gemstones',
        attributes: ['id', 'name', 'slug'],
        through: { attributes: [] },
        required: false
      }
    ]
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Get available sizes
  // Note: metals are already fetched through the product's many-to-many relationship

  const availableSizes = await ProductSizes.findAll({
    where: {
      category_id: product.category_id,
      is_active: true
    },
    order: [['sort_order', 'ASC']],
    attributes: ['id', 'size_name', 'size_value']
  });

  // Get recommended products (same category first, then any category if not enough)
  let recommendedProducts = await Product.findAll({
    where: {
      category_id: product.category_id,
      id: { [Op.ne]: product.id },
      is_active: true
    },
    include: [
      {
        model: ProductImage,
        as: 'images',
        attributes: ['image_url', 'alt_text'],
        where: { is_primary: true },
        required: false
      }
    ],
    limit: 6,
    attributes: ['id', 'name', 'slug', 'base_price', 'sale_price', 'currency']
  });

  // If not enough products in same category, get random products from other categories
  if (recommendedProducts.length < 6) {
    const existingIds = [product.id, ...recommendedProducts.map(p => p.id)];
    const additionalProducts = await Product.findAll({
      where: {
        id: { [Op.notIn]: existingIds },
        is_active: true
      },
      include: [
        {
          model: ProductImage,
          as: 'images',
          attributes: ['image_url', 'alt_text'],
          where: { is_primary: true },
          required: false
        }
      ],
      limit: 6 - recommendedProducts.length,
      order: [['id', 'DESC']], // Show newest products
      attributes: ['id', 'name', 'slug', 'base_price', 'sale_price', 'currency']
    });

    recommendedProducts = [...recommendedProducts, ...additionalProducts];
  }

  // Remove duplicates based on product ID
  const uniqueRecommendedProducts = recommendedProducts.filter((product, index, self) =>
    index === self.findIndex(p => p.id === product.id)
  );

  const currentPrice = product.sale_price || product.base_price;

  // Combine images and videos into a single media array
  const mediaItems = [];

  // Add images first (maintaining their original sort order)
  product.images.forEach(img => {
    mediaItems.push({
      id: img.id,
      url: img.image_url,
      alt: img.alt_text || product.name,
      is_primary: img.is_primary,
      type: 'image',
      sort_order: img.sort_order
    });
  });

  // Add videos after images (with their sort order)
  product.videos.forEach(video => {
    mediaItems.push({
      id: video.id,
      url: video.video_url,
      alt: video.title || product.name,
      is_primary: false,
      type: 'video',
      sort_order: video.sort_order + 1000 // Offset to place videos after images
    });
  });

  // Sort all media by sort_order
  mediaItems.sort((a, b) => a.sort_order - b.sort_order);

  const transformedProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: `£${parseFloat(currentPrice).toLocaleString()}`,
    base_price: parseFloat(product.base_price),
    sale_price: product.sale_price ? parseFloat(product.sale_price) : null,
    currency: product.currency,
    description: product.description,
    short_description: product.short_description,
    sku: product.sku,
    care_instructions: product.care_instructions,
    warranty_info: product.warranty_info,
    weight: product.weight,
    dimensions: product.dimensions,
    category: product.category,
    collection: product.collection,
    is_featured: product.is_featured,
    in_stock: product.in_stock,
    stock_quantity: product.stock_quantity,
    images: mediaItems,
    variants: product.variants.map(variant => ({
      id: variant.id,
      name: variant.variant_name,
      price_adjustment: parseFloat(variant.price_adjustment),
      metal_type: variant.metal_type,
      metal_color: variant.metal_color,
      size: variant.size,
      gemstone_type: variant.gemstone_type,
      gemstone_carat: variant.gemstone_carat,
      stock_quantity: variant.stock_quantity
    })),
    available_metals: (product.metals || []).map(metal => ({
      id: metal.id,
      name: metal.name,
      color: metal.color_code
    })),
    available_ring_types: (product.ringTypes || []).map(ringType => ({
      id: ringType.id,
      name: ringType.name,
      slug: ringType.slug
    })),
    available_gemstones: (product.gemstones || []).map(gemstone => ({
      id: gemstone.id,
      name: gemstone.name,
      slug: gemstone.slug
    })),
    available_sizes: availableSizes.map(size => ({
      id: size.id,
      name: size.size_name,
      value: size.size_value
    })),
    breadcrumbs: [
      {
        name: product.category.name,
        href: `/${product.category.slug}`
      },
      {
        name: product.name,
        href: `#`
      }
    ]
  };

  const transformedRecommended = uniqueRecommendedProducts.map(rec => ({
    id: rec.id,
    name: rec.name,
    slug: rec.slug,
    price: `£${parseFloat(rec.sale_price || rec.base_price).toLocaleString()}`,
    image: rec.images[0] ? rec.images[0].image_url : null
  }));

  res.json({
    success: true,
    data: {
      product: transformedProduct,
      recommended_products: transformedRecommended
    }
  });
});

const getAllCategories = asyncHandler(async (req, res) => {
  const { Category, Product } = getModelInstance();
  const categories = await Category.findAll({
    where: { is_active: true, parent_id: null }, // Only get parent categories
    order: [['sort_order', 'ASC'], ['name', 'ASC']],
    attributes: ['id', 'name', 'slug', 'description', 'image_url', 'parent_id'],
    include: [
      {
        model: Product,
        as: 'products',
        attributes: ['id'],
        where: { is_active: true },
        required: false
      },
      {
        model: Category,
        as: 'children',
        attributes: ['id', 'name', 'slug', 'description', 'image_url', 'parent_id'],
        where: { is_active: true },
        required: false,
        include: [
          {
            model: Product,
            as: 'products',
            attributes: ['id'],
            where: { is_active: true },
            required: false
          }
        ]
      }
    ]
  });

  const transformedCategories = categories.map(category => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image_url: category.image_url,
    parent_id: category.parent_id,
    product_count: category.products.length,
    children: category.children ? category.children.map(child => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      description: child.description,
      image_url: child.image_url,
      parent_id: child.parent_id,
      product_count: child.products.length
    })) : []
  }));

  res.json({
    success: true,
    data: transformedCategories
  });
});

const getProductsByCategory = asyncHandler(async (req, res) => {
  const { Category, Product, ProductImage } = getModelInstance();
  const { categorySlug } = req.params;
  const { page = 1, limit = 12 } = req.query;

  const category = await Category.findOne({
    where: { slug: categorySlug, is_active: true }
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Use the existing getAllProducts logic with category filter
  req.query.category = categorySlug;
  await getAllProducts(req, res);
});

const getNavigationData = asyncHandler(async (req, res) => {
  const { RingTypes, Gemstones, ProductMetals, Collection } = getModelInstance();

  try {
    // Fetch all navigation data in parallel
    const [ringTypes, gemstones, metals, collections] = await Promise.all([
      RingTypes.findAll({
        where: { is_active: true },
        order: [['sort_order', 'ASC'], ['name', 'ASC']],
        attributes: ['id', 'name', 'slug', 'description']
      }),
      Gemstones.findAll({
        where: { is_active: true },
        order: [['sort_order', 'ASC'], ['name', 'ASC']],
        attributes: ['id', 'name', 'slug', 'description']
      }),
      ProductMetals.findAll({
        where: { is_active: true },
        order: [['sort_order', 'ASC'], ['name', 'ASC']],
        attributes: ['id', 'name', 'color_code']
      }),
      Collection.findAll({
        where: { is_active: true },
        order: [['sort_order', 'ASC'], ['name', 'ASC']],
        attributes: ['id', 'name', 'slug', 'description']
      })
    ]);

    res.json({
      success: true,
      data: {
        ring_types: ringTypes,
        gemstones: gemstones,
        metals: metals,
        eternity_rings: collections // Using collections as eternity rings
      }
    });
  } catch (error) {
    logger.error('Error in getNavigationData:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch navigation data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = {
  getAllProducts,
  getProductBySlug,
  getAllCategories,
  getProductsByCategory,
  getNavigationData
};
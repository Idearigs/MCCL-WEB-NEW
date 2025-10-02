const { Op } = require('sequelize');
const { getModels } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../config/database');

const getModelInstance = () => {
  const models = getModels();
  if (!models.WatchBrand || !models.WatchCollection || !models.Watch || !models.WatchImage || !models.WatchSpecification || !models.WatchVariant) {
    throw new Error('Watch models not initialized properly');
  }
  return models;
};

// BRAND MANAGEMENT

const getAllBrands = asyncHandler(async (req, res) => {
  const { WatchBrand, WatchCollection, Watch } = getModelInstance();

  const brands = await WatchBrand.findAll({
    order: [['sort_order', 'ASC'], ['name', 'ASC']],
    include: [
      {
        model: WatchCollection,
        as: 'collections',
        attributes: ['id', 'name'],
        where: { is_active: true },
        required: false
      },
      {
        model: Watch,
        as: 'watches',
        attributes: ['id'],
        where: { is_active: true },
        required: false
      }
    ]
  });

  const transformedBrands = brands.map(brand => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    description: brand.description,
    logo_url: brand.logo_url,
    website_url: brand.website_url,
    founded_year: brand.founded_year,
    country_origin: brand.country_origin,
    is_active: brand.is_active,
    collections_count: brand.collections ? brand.collections.length : 0,
    watches_count: brand.watches ? brand.watches.length : 0
  }));

  res.json({
    success: true,
    data: transformedBrands
  });
});

const createBrand = asyncHandler(async (req, res) => {
  const { WatchBrand } = getModelInstance();
  const { name, description, logo_url, website_url, founded_year, country_origin } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Brand name is required'
    });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-');

  const existingBrand = await WatchBrand.findOne({ where: { slug } });
  if (existingBrand) {
    return res.status(400).json({
      success: false,
      message: 'Brand with this name already exists'
    });
  }

  const brand = await WatchBrand.create({
    name,
    slug,
    description,
    logo_url,
    website_url,
    founded_year,
    country_origin
  });

  res.status(201).json({
    success: true,
    data: brand
  });
});

const updateBrand = asyncHandler(async (req, res) => {
  const { WatchBrand } = getModelInstance();
  const { id } = req.params;
  const updateData = req.body;

  const brand = await WatchBrand.findByPk(id);
  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found'
    });
  }

  if (updateData.name && updateData.name !== brand.name) {
    updateData.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-');
  }

  await brand.update(updateData);

  res.json({
    success: true,
    data: brand
  });
});

const deleteBrand = asyncHandler(async (req, res) => {
  const { WatchBrand, Watch } = getModelInstance();
  const { id } = req.params;

  const brand = await WatchBrand.findByPk(id);
  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found'
    });
  }

  const watchCount = await Watch.count({ where: { brand_id: id } });
  if (watchCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete brand. ${watchCount} watches are associated with this brand.`
    });
  }

  await brand.destroy();

  res.json({
    success: true,
    message: 'Brand deleted successfully'
  });
});

// COLLECTION MANAGEMENT

const getCollectionsByBrand = asyncHandler(async (req, res) => {
  const { WatchCollection, Watch } = getModelInstance();
  const { brandId } = req.params;

  const collections = await WatchCollection.findAll({
    where: { brand_id: brandId },
    order: [['sort_order', 'ASC'], ['name', 'ASC']],
    include: [
      {
        model: Watch,
        as: 'watches',
        attributes: ['id'],
        where: { is_active: true },
        required: false
      }
    ]
  });

  const transformedCollections = collections.map(collection => ({
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    image_url: collection.image_url,
    is_featured: collection.is_featured,
    is_active: collection.is_active,
    launch_year: collection.launch_year,
    target_audience: collection.target_audience,
    watches_count: collection.watches ? collection.watches.length : 0
  }));

  res.json({
    success: true,
    data: transformedCollections
  });
});

const createCollection = asyncHandler(async (req, res) => {
  const { WatchCollection } = getModelInstance();
  const { brand_id, name, description, image_url, launch_year, target_audience } = req.body;

  if (!brand_id || !name) {
    return res.status(400).json({
      success: false,
      message: 'Brand ID and collection name are required'
    });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-');

  const existingCollection = await WatchCollection.findOne({
    where: { brand_id, slug }
  });

  if (existingCollection) {
    return res.status(400).json({
      success: false,
      message: 'Collection with this name already exists for this brand'
    });
  }

  const collection = await WatchCollection.create({
    brand_id,
    name,
    slug,
    description,
    image_url,
    launch_year,
    target_audience
  });

  res.status(201).json({
    success: true,
    data: collection
  });
});

const getFeaturedCollections = asyncHandler(async (req, res) => {
  const { WatchBrand, WatchCollection, Watch } = getModelInstance();

  // Fetch all active brands with their featured/latest collections
  const brands = await WatchBrand.findAll({
    where: { is_active: true },
    order: [['sort_order', 'ASC'], ['name', 'ASC']],
    include: [
      {
        model: WatchCollection,
        as: 'collections',
        where: {
          is_active: true,
          [Op.or]: [
            { is_featured: true },
            { id: { [Op.ne]: null } } // Get all collections if no featured ones
          ]
        },
        required: false,
        order: [['is_featured', 'DESC'], ['created_at', 'DESC']],
        limit: 3, // Get top 3 collections per brand
        include: [
          {
            model: Watch,
            as: 'watches',
            attributes: ['id'],
            where: { is_active: true },
            required: false
          }
        ]
      }
    ]
  });

  const transformedData = brands.map(brand => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logo_url: brand.logo_url,
    collections: brand.collections ? brand.collections.slice(0, 3).map(collection => ({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      image_url: collection.image_url,
      is_featured: collection.is_featured,
      launch_year: collection.launch_year,
      watches_count: collection.watches ? collection.watches.length : 0
    })) : []
  }));

  res.json({
    success: true,
    data: transformedData
  });
});

const getCollectionBySlug = asyncHandler(async (req, res) => {
  const { WatchBrand, WatchCollection, Watch, WatchImage, WatchSpecification } = getModelInstance();
  const { slug } = req.params;

  const collection = await WatchCollection.findOne({
    where: { slug, is_active: true },
    include: [
      {
        model: WatchBrand,
        as: 'brand',
        attributes: ['id', 'name', 'slug']
      },
      {
        model: Watch,
        as: 'watches',
        where: { is_active: true },
        required: false,
        include: [
          {
            model: WatchImage,
            as: 'images',
            attributes: ['id', 'image_url', 'alt_text', 'is_primary'],
            order: [['is_primary', 'DESC'], ['sort_order', 'ASC']]
          },
          {
            model: WatchSpecification,
            as: 'specifications',
            attributes: ['movement', 'case_material', 'case_diameter'],
            required: false
          }
        ]
      }
    ]
  });

  if (!collection) {
    return res.status(404).json({
      success: false,
      message: 'Collection not found'
    });
  }

  const transformedWatches = collection.watches ? collection.watches.map(watch => {
    const primaryImage = watch.images.find(img => img.is_primary) || watch.images[0];
    const currentPrice = watch.sale_price || watch.base_price;

    return {
      id: watch.id,
      name: watch.name,
      slug: watch.slug,
      price: `£${parseFloat(currentPrice).toLocaleString()}`,
      base_price: parseFloat(watch.base_price),
      sale_price: watch.sale_price ? parseFloat(watch.sale_price) : null,
      description: watch.short_description || watch.description,
      gender: watch.gender,
      watch_type: watch.watch_type,
      style: watch.style,
      is_featured: watch.is_featured,
      in_stock: watch.in_stock,
      image: primaryImage ? {
        url: primaryImage.image_url,
        alt: primaryImage.alt_text || watch.name
      } : null,
      specifications: watch.specifications
    };
  }) : [];

  res.json({
    success: true,
    data: {
      collection: {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        image_url: collection.image_url,
        is_featured: collection.is_featured,
        launch_year: collection.launch_year,
        target_audience: collection.target_audience,
        brand: collection.brand
      },
      watches: transformedWatches
    }
  });
});

// WATCH MANAGEMENT

const getAllWatches = asyncHandler(async (req, res) => {
  const { WatchBrand, WatchCollection, Watch, WatchImage, WatchSpecification, WatchVariant } = getModelInstance();
  const {
    brand,
    collection,
    gender,
    watch_type,
    style,
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
      model: WatchBrand,
      as: 'brand',
      attributes: ['id', 'name', 'slug']
    },
    {
      model: WatchCollection,
      as: 'collection',
      attributes: ['id', 'name', 'slug'],
      required: false
    },
    {
      model: WatchImage,
      as: 'images',
      attributes: ['id', 'image_url', 'alt_text', 'is_primary', 'sort_order'],
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
    },
    {
      model: WatchSpecification,
      as: 'specifications',
      attributes: ['movement', 'case_material', 'case_diameter', 'water_resistance'],
      required: false
    },
    {
      model: WatchVariant,
      as: 'variants',
      attributes: ['id', 'variant_name', 'price_adjustment', 'size', 'strap_type', 'stock_quantity'],
      where: { is_active: true },
      required: false
    }
  ];

  // Brand filter
  if (brand) {
    include[0].where = { slug: brand };
    include[0].required = true;
  }

  // Collection filter
  if (collection) {
    include[1].where = { slug: collection };
    include[1].required = true;
  }

  // Other filters
  if (gender) whereClause.gender = gender;
  if (watch_type) whereClause.watch_type = watch_type;
  if (style) whereClause.style = style;
  if (featured !== undefined) whereClause.is_featured = featured === 'true';
  if (in_stock !== undefined) whereClause.in_stock = in_stock === 'true';

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

  const { count, rows: watches } = await Watch.findAndCountAll({
    where: whereClause,
    include,
    order: orderBy,
    limit: parseInt(limit),
    offset,
    distinct: true
  });

  const transformedWatches = watches.map(watch => {
    const images = watch.images || [];
    const primaryImage = images.find(img => img.is_primary) || images[0];
    const currentPrice = watch.sale_price || watch.base_price;

    return {
      id: watch.id,
      name: watch.name,
      slug: watch.slug,
      price: currentPrice ? `£${parseFloat(currentPrice).toLocaleString()}` : '£0',
      base_price: parseFloat(watch.base_price) || 0,
      sale_price: watch.sale_price ? parseFloat(watch.sale_price) : null,
      currency: watch.currency,
      description: watch.short_description || watch.description,
      brand: watch.brand,
      collection: watch.collection,
      gender: watch.gender,
      watch_type: watch.watch_type,
      style: watch.style,
      is_featured: watch.is_featured,
      in_stock: watch.in_stock,
      stock_quantity: watch.stock_quantity,
      image: primaryImage ? {
        url: primaryImage.image_url,
        alt: primaryImage.alt_text || watch.name
      } : null,
      specifications: watch.specifications,
      variants_count: watch.variants ? watch.variants.length : 0,
      created_at: watch.created_at
    };
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      watches: transformedWatches,
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
});

const getWatchBySlug = asyncHandler(async (req, res) => {
  const { WatchBrand, WatchCollection, Watch, WatchImage, WatchSpecification, WatchVariant } = getModelInstance();
  const { slug } = req.params;

  const watch = await Watch.findOne({
    where: { slug, is_active: true },
    include: [
      {
        model: WatchBrand,
        as: 'brand',
        attributes: ['id', 'name', 'slug']
      },
      {
        model: WatchCollection,
        as: 'collection',
        attributes: ['id', 'name', 'slug'],
        required: false
      },
      {
        model: WatchImage,
        as: 'images',
        attributes: ['id', 'image_url', 'alt_text', 'is_primary', 'sort_order', 'image_type'],
        order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
      },
      {
        model: WatchSpecification,
        as: 'specifications',
        required: false
      },
      {
        model: WatchVariant,
        as: 'variants',
        where: { is_active: true },
        required: false
      }
    ]
  });

  if (!watch) {
    return res.status(404).json({
      success: false,
      message: 'Watch not found'
    });
  }

  // Get recommended watches from same brand
  const recommendedWatches = await Watch.findAll({
    where: {
      brand_id: watch.brand_id,
      id: { [Op.ne]: watch.id },
      is_active: true
    },
    include: [
      {
        model: WatchImage,
        as: 'images',
        attributes: ['image_url', 'alt_text'],
        where: { is_primary: true },
        required: false
      }
    ],
    limit: 6,
    attributes: ['id', 'name', 'slug', 'base_price', 'sale_price', 'currency']
  });

  const currentPrice = watch.sale_price || watch.base_price;

  const transformedWatch = {
    id: watch.id,
    name: watch.name,
    slug: watch.slug,
    model_number: watch.model_number,
    price: `£${parseFloat(currentPrice).toLocaleString()}`,
    base_price: parseFloat(watch.base_price),
    sale_price: watch.sale_price ? parseFloat(watch.sale_price) : null,
    currency: watch.currency,
    description: watch.description,
    short_description: watch.short_description,
    sku: watch.sku,
    gender: watch.gender,
    watch_type: watch.watch_type,
    style: watch.style,
    warranty_years: watch.warranty_years,
    care_instructions: watch.care_instructions,
    brand: watch.brand,
    collection: watch.collection,
    is_featured: watch.is_featured,
    in_stock: watch.in_stock,
    stock_quantity: watch.stock_quantity,
    availability_status: watch.availability_status,
    images: watch.images.map(img => ({
      id: img.id,
      url: img.image_url,
      alt: img.alt_text || watch.name,
      is_primary: img.is_primary,
      type: img.image_type,
      sort_order: img.sort_order
    })),
    specifications: watch.specifications,
    variants: watch.variants ? watch.variants.map(variant => ({
      id: variant.id,
      name: variant.variant_name,
      price_adjustment: parseFloat(variant.price_adjustment),
      size: variant.size,
      strap_type: variant.strap_type,
      strap_color: variant.strap_color,
      dial_variant: variant.dial_variant,
      stock_quantity: variant.stock_quantity
    })) : []
  };

  const transformedRecommended = recommendedWatches.map(rec => ({
    id: rec.id,
    name: rec.name,
    slug: rec.slug,
    price: `£${parseFloat(rec.sale_price || rec.base_price).toLocaleString()}`,
    image: rec.images[0] ? rec.images[0].image_url : null
  }));

  res.json({
    success: true,
    data: {
      watch: transformedWatch,
      recommended_watches: transformedRecommended
    }
  });
});

const createWatch = asyncHandler(async (req, res) => {
  const { Watch } = getModelInstance();
  const {
    brand_id,
    collection_id,
    name,
    model_number,
    description,
    short_description,
    base_price,
    sale_price,
    currency = 'GBP',
    sku,
    gender = 'unisex',
    watch_type = 'analog',
    style = 'casual',
    warranty_years = 2,
    care_instructions,
    stock_quantity = 0
  } = req.body;

  if (!brand_id || !name || !base_price) {
    return res.status(400).json({
      success: false,
      message: 'Brand ID, watch name, and base price are required'
    });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-');

  const existingWatch = await Watch.findOne({ where: { slug } });
  if (existingWatch) {
    return res.status(400).json({
      success: false,
      message: 'Watch with this name already exists'
    });
  }

  const watch = await Watch.create({
    brand_id,
    collection_id,
    name,
    slug,
    model_number,
    description,
    short_description,
    base_price,
    sale_price,
    currency,
    sku,
    gender,
    watch_type,
    style,
    warranty_years,
    care_instructions,
    stock_quantity,
    in_stock: stock_quantity > 0,
    availability_status: stock_quantity > 0 ? 'in_stock' : 'out_of_stock'
  });

  res.status(201).json({
    success: true,
    data: watch
  });
});

const updateWatch = asyncHandler(async (req, res) => {
  const { Watch } = getModelInstance();
  const { id } = req.params;
  const updateData = req.body;

  const watch = await Watch.findByPk(id);
  if (!watch) {
    return res.status(404).json({
      success: false,
      message: 'Watch not found'
    });
  }

  if (updateData.name && updateData.name !== watch.name) {
    updateData.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-');
  }

  if (updateData.stock_quantity !== undefined) {
    updateData.in_stock = updateData.stock_quantity > 0;
    updateData.availability_status = updateData.stock_quantity > 0 ? 'in_stock' : 'out_of_stock';
  }

  await watch.update(updateData);

  res.json({
    success: true,
    data: watch
  });
});

const deleteWatch = asyncHandler(async (req, res) => {
  const { Watch } = getModelInstance();
  const { id } = req.params;

  const watch = await Watch.findByPk(id);
  if (!watch) {
    return res.status(404).json({
      success: false,
      message: 'Watch not found'
    });
  }

  await watch.destroy();

  res.json({
    success: true,
    message: 'Watch deleted successfully'
  });
});

// SPECIFICATIONS MANAGEMENT

const updateWatchSpecifications = asyncHandler(async (req, res) => {
  const { WatchSpecification } = getModelInstance();
  const { watchId } = req.params;
  const specData = req.body;

  let specifications = await WatchSpecification.findOne({
    where: { watch_id: watchId }
  });

  if (specifications) {
    await specifications.update(specData);
  } else {
    specifications = await WatchSpecification.create({
      watch_id: watchId,
      ...specData
    });
  }

  res.json({
    success: true,
    data: specifications
  });
});

// IMAGE MANAGEMENT

const addWatchImage = asyncHandler(async (req, res) => {
  const { WatchImage } = getModelInstance();
  const { watchId } = req.params;
  const { image_url, alt_text, is_primary = false, image_type = 'product', sort_order = 0 } = req.body;

  if (!image_url) {
    return res.status(400).json({
      success: false,
      message: 'Image URL is required'
    });
  }

  // If this is primary, unset other primary images
  if (is_primary) {
    await WatchImage.update(
      { is_primary: false },
      { where: { watch_id: watchId } }
    );
  }

  const image = await WatchImage.create({
    watch_id: watchId,
    image_url,
    alt_text,
    is_primary,
    image_type,
    sort_order
  });

  res.status(201).json({
    success: true,
    data: image
  });
});

const deleteWatchImage = asyncHandler(async (req, res) => {
  const { WatchImage } = getModelInstance();
  const { imageId } = req.params;

  const image = await WatchImage.findByPk(imageId);
  if (!image) {
    return res.status(404).json({
      success: false,
      message: 'Image not found'
    });
  }

  await image.destroy();

  res.json({
    success: true,
    message: 'Image deleted successfully'
  });
});

module.exports = {
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getCollectionsByBrand,
  createCollection,
  getFeaturedCollections,
  getCollectionBySlug,
  getAllWatches,
  getWatchBySlug,
  createWatch,
  updateWatch,
  deleteWatch,
  updateWatchSpecifications,
  addWatchImage,
  deleteWatchImage
};
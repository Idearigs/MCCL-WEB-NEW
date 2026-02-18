const { getModels } = require('../models');
const { Op } = require('sequelize');
const { generateFileUrl } = require('../middleware/upload');
const path = require('path');

// Helper function to get models
const getModelInstance = () => {
  const models = getModels();
  if (!models.Product || !models.Category || !models.Collection || !models.ProductImage || !models.ProductVideo || !models.ProductVariant || !models.ProductMetals || !models.ProductSizes || !models.RingTypes || !models.StoneShapes || !models.StoneTypes) {
    throw new Error('Models not initialized properly');
  }
  return models;
};

// Helper function to generate slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Helper function to generate unique slug
const generateUniqueSlug = async (name, Product) => {
  let baseSlug = generateSlug(name);
  let uniqueSlug = baseSlug;
  let counter = 1;

  while (true) {
    const existingProduct = await Product.findOne({ where: { slug: uniqueSlug } });
    if (!existingProduct) {
      return uniqueSlug;
    }
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// Helper function to generate SKU
const generateSKU = (name, categorySlug) => {
  const prefix = categorySlug.substring(0, 3).toUpperCase();
  const namePart = name.substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${namePart}-${timestamp}`;
};

// Helper function to validate and sanitize Nivoda options
const validateNivodaOptions = (config) => {
  if (!config) return null;

  // Valid Nivoda grades based on API documentation
  const VALID_CUTS = ['EX', 'VG', 'G', 'F'];
  const VALID_CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'SI3', 'I1', 'I2', 'I3'];
  const VALID_COLOURS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];

  // Sanitize cut options - remove invalid ones
  if (config.cutOptions && Array.isArray(config.cutOptions)) {
    const validCuts = config.cutOptions.filter(cut => VALID_CUTS.includes(cut.toUpperCase()));
    config.cutOptions = validCuts.map(cut => cut.toUpperCase());
  }

  // Sanitize clarity options - remove invalid ones
  if (config.clarityOptions && Array.isArray(config.clarityOptions)) {
    const validClarities = config.clarityOptions.filter(clarity => VALID_CLARITIES.includes(clarity.toUpperCase()));
    config.clarityOptions = validClarities.map(clarity => clarity.toUpperCase());
  }

  // Sanitize colour options - remove invalid ones
  if (config.colourOptions && Array.isArray(config.colourOptions)) {
    const validColours = config.colourOptions.filter(colour => VALID_COLOURS.includes(colour.toUpperCase()));
    config.colourOptions = validColours.map(colour => colour.toUpperCase());
  }

  return config;
};

// Get all products with pagination and filters for admin
const getProducts = async (req, res) => {
  try {
    const { Product, Category, Collection, ProductImage, ProductVariant } = getModelInstance();

    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      collection = '',
      status = '',
      featured = '',
      jewelryCategory = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where conditions
    const whereConditions = {};

    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status !== '') {
      whereConditions.is_active = status === 'active';
    }

    if (featured !== '') {
      whereConditions.is_featured = featured === 'true';
    }

    if (category) {
      whereConditions.category_id = category;
    }

    if (collection) {
      whereConditions.collection_id = collection;
    }

    if (jewelryCategory) {
      whereConditions.jewelry_sub_type_id = jewelryCategory;
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereConditions,
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
          where: { is_primary: true },
          required: false,
          limit: 1,
          attributes: ['id', 'image_url', 'alt_text']
        },
        {
          model: ProductVariant,
          as: 'variants',
          required: false,
          attributes: ['id', 'variant_name', 'price_adjustment', 'stock_quantity']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    // Transform products for admin view
    const transformedProducts = products.map(product => {
      const primaryImage = product.images[0];
      const totalVariants = product.variants.length;
      const totalStock = product.variants.reduce((sum, variant) => sum + (variant.stock_quantity || 0), 0) + product.stock_quantity;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        base_price: parseFloat(product.base_price),
        sale_price: product.sale_price ? parseFloat(product.sale_price) : null,
        currency: product.currency,
        category: product.category,
        collection: product.collection,
        is_active: product.is_active,
        is_featured: product.is_featured,
        in_stock: product.in_stock,
        stock_quantity: totalStock,
        variants_count: totalVariants,
        primary_image: primaryImage ? primaryImage.image_url : null,
        created_at: product.created_at,
        updated_at: product.updated_at
      };
    });

    res.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          limit: parseInt(limit),
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Get single product by ID for admin
const getProductById = async (req, res) => {
  try {
    const { Product, Category, Collection, ProductImage, ProductVideo, ProductVariant, RingTypes, StoneShapes, StoneTypes, ProductMetals, DiamondSizes } = getModelInstance();
    const { id } = req.params;

    const product = await Product.findByPk(id, {
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
          attributes: ['id', 'image_url', 'alt_text', 'is_primary', 'sort_order', 'metal_id', 'is_metal_preview', 'diamond_size_id', 'is_diamond_size_preview'],
          order: [['sort_order', 'ASC']]
        },
        {
          model: ProductVideo,
          as: 'videos',
          attributes: ['id', 'video_url', 'title', 'description', 'sort_order', 'metal_id'],
          order: [['sort_order', 'ASC']]
        },
        {
          model: ProductVariant,
          as: 'variants',
          attributes: [
            'id', 'variant_name', 'sku', 'price_adjustment',
            'metal_type', 'metal_color', 'size', 'gemstone_type',
            'gemstone_carat', 'stock_quantity', 'is_active'
          ],
          order: [['variant_name', 'ASC']]
        },
        {
          model: RingTypes,
          as: 'ringTypes',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] }
        },
        {
          model: StoneShapes,
          as: 'stoneShapes',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] }
        },
        {
          model: StoneTypes,
          as: 'stoneType',
          attributes: ['id', 'name', 'slug'],
          required: false
        },
        {
          model: RingTypes,
          as: 'ringStyle1',
          attributes: ['id', 'name', 'slug'],
          required: false
        },
        {
          model: RingTypes,
          as: 'ringStyle2',
          attributes: ['id', 'name', 'slug'],
          required: false
        },
        {
          model: RingTypes,
          as: 'ringStyle3',
          attributes: ['id', 'name', 'slug'],
          required: false
        },
        {
          model: RingTypes,
          as: 'ringStyle4',
          attributes: ['id', 'name', 'slug'],
          required: false
        },
        {
          model: RingTypes,
          as: 'ringStyle5',
          attributes: ['id', 'name', 'slug'],
          required: false
        },
        {
          model: ProductMetals,
          as: 'metals',
          attributes: ['id', 'name', 'color_code'],
          through: { attributes: [] }
        },
        {
          model: DiamondSizes,
          as: 'diamondSizes',
          attributes: ['id', 'name', 'display_name', 'sort_order'],
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

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    console.log('DEBUG createProduct: Request received');
    console.log('DEBUG: Request body keys:', Object.keys(req.body));
    console.log('DEBUG: Files:', req.files ? req.files.length : 0);

    const {
      Product,
      Category,
      Collection,
      ProductImage,
      ProductVideo,
      ProductVariant,
      RingTypes,
      StoneShapes,
      StoneTypes,
      ProductMetals,
      ProductRingTypes,
      ProductStoneShapes,
      ProductMetalsJunction,
      ProductDiamondSizes
    } = getModelInstance();

    const {
      name,
      description,
      short_description,
      sku: providedSku,
      base_price,
      sale_price,
      currency = 'GBP',
      category_id,
      collection_id,
      ring_type_ids = [],
      stone_shape_ids = [],
      stone_type_id = null,
      ring_style_1_id = null,
      ring_style_2_id = null,
      ring_style_3_id = null,
      ring_style_4_id = null,
      ring_style_5_id = null,
      metal_ids = [],
      diamond_size_ids = [],
      jewelry_sub_type_id = null,
      is_active = true,
      is_featured = false,
      in_stock = true,
      stock_quantity = 0,
      // Made on Request fields
      is_made_on_request = false,
      made_on_request_lead_time = '4-6 weeks',
      made_on_request_message = '',
      weight,
      dimensions,
      care_instructions,
      warranty_info,
      meta_title,
      meta_description,
      images = [],
      videos = [],
      variants = [],
      nivoda_options_config
    } = req.body;

    console.log('DEBUG: Extracted name:', name, 'category_id:', category_id, 'base_price:', base_price);

    // Validation
    if (!name || !base_price || !category_id) {
      console.error('DEBUG: Validation failed - name, base_price, or category_id missing');
      return res.status(400).json({
        success: false,
        message: 'Name, base price, and category are required',
        received: { name, base_price, category_id }
      });
    }

    // Get category for SKU generation
    const category = await Category.findByPk(category_id);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    // Generate unique slug and use provided SKU or generate one
    const slug = await generateUniqueSlug(name, Product);
    const sku = providedSku && providedSku.trim() !== '' ? providedSku.trim() : generateSKU(name, category.slug);

    // Process and validate Nivoda configuration
    let processedNivodaConfig = null;
    if (nivoda_options_config) {
      processedNivodaConfig = typeof nivoda_options_config === 'string'
        ? JSON.parse(nivoda_options_config)
        : nivoda_options_config;
      // Sanitize invalid options
      processedNivodaConfig = validateNivodaOptions(processedNivodaConfig);
    }

    // Create product
    const product = await Product.create({
      name,
      slug,
      description,
      short_description,
      sku,
      base_price,
      sale_price,
      currency,
      category_id,
      collection_id: collection_id || null,
      jewelry_sub_type_id: jewelry_sub_type_id || null,
      stone_type_id: stone_type_id || null,
      ring_style_1_id: ring_style_1_id || null,
      ring_style_2_id: ring_style_2_id || null,
      ring_style_3_id: ring_style_3_id || null,
      ring_style_4_id: ring_style_4_id || null,
      ring_style_5_id: ring_style_5_id || null,
      is_active,
      is_featured,
      in_stock,
      stock_quantity,
      // Made on Request fields
      is_made_on_request,
      made_on_request_lead_time: is_made_on_request ? made_on_request_lead_time : null,
      made_on_request_message: is_made_on_request ? made_on_request_message : null,
      weight,
      dimensions,
      care_instructions,
      warranty_info,
      meta_title: meta_title || name,
      meta_description: meta_description || short_description,
      nivoda_options_config: processedNivodaConfig
    });

    // Create product images if provided
    if (images && images.length > 0) {
      const imagePromises = images.map((image, index) =>
        ProductImage.create({
          product_id: product.id,
          image_url: image.url,
          alt_text: image.alt_text || name,
          is_primary: index === 0,
          sort_order: index,
          metal_id: image.metal_id || null
        })
      );
      await Promise.all(imagePromises);
    }

    // Create product videos if provided
    if (videos && videos.length > 0) {
      const videoPromises = videos.map((video, index) =>
        ProductVideo.create({
          product_id: product.id,
          video_url: video.url,
          title: video.title || name,
          description: video.description || '',
          sort_order: index,
          metal_id: video.metal_id || null
        })
      );
      await Promise.all(videoPromises);
    }

    // Create many-to-many relationships
    const relationshipPromises = [];

    // Ring type relationships
    if (ring_type_ids && ring_type_ids.length > 0) {
      const ringTypePromises = ring_type_ids.map(ringTypeId =>
        ProductRingTypes.create({
          product_id: product.id,
          ring_type_id: ringTypeId
        })
      );
      relationshipPromises.push(...ringTypePromises);
    }

    // Stone shape relationships
    if (stone_shape_ids && stone_shape_ids.length > 0) {
      const stoneShapePromises = stone_shape_ids.map(stoneShapeId =>
        ProductStoneShapes.create({
          product_id: product.id,
          stone_shape_id: stoneShapeId
        })
      );
      relationshipPromises.push(...stoneShapePromises);
    }

    // Metal relationships
    if (metal_ids && metal_ids.length > 0) {
      const metalPromises = metal_ids.map(metalId =>
        ProductMetalsJunction.create({
          product_id: product.id,
          metal_id: metalId
        })
      );
      relationshipPromises.push(...metalPromises);
    }

    // Diamond size relationships (for Engagement Rings)
    if (diamond_size_ids && diamond_size_ids.length > 0 && ProductDiamondSizes) {
      const diamondSizePromises = diamond_size_ids.map(diamondSizeId =>
        ProductDiamondSizes.create({
          product_id: product.id,
          diamond_size_id: diamondSizeId
        })
      );
      relationshipPromises.push(...diamondSizePromises);
    }

    // Execute all relationship promises
    if (relationshipPromises.length > 0) {
      await Promise.all(relationshipPromises);
    }

    // Create product variants if provided
    if (variants && variants.length > 0) {
      const variantPromises = variants.map(variant =>
        ProductVariant.create({
          product_id: product.id,
          ...variant,
          sku: variant.sku || `${sku}-${variant.variant_name.substring(0, 3).toUpperCase()}`
        })
      );
      await Promise.all(variantPromises);
    }

    // Fetch the complete product with relationships
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Collection, as: 'collection', required: false },
        { model: ProductImage, as: 'images' },
        { model: ProductVideo, as: 'videos' },
        { model: ProductVariant, as: 'variants' },
        { model: RingTypes, as: 'ringTypes' },
        { model: StoneShapes, as: 'stoneShapes' },
        { model: StoneTypes, as: 'stoneType', required: false },
        { model: RingTypes, as: 'ringStyle1', required: false },
        { model: RingTypes, as: 'ringStyle2', required: false },
        { model: RingTypes, as: 'ringStyle3', required: false },
        { model: RingTypes, as: 'ringStyle4', required: false },
        { model: RingTypes, as: 'ringStyle5', required: false },
        { model: ProductMetals, as: 'metals' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: createdProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const {
      Product,
      Category,
      Collection,
      ProductImage,
      ProductVideo,
      ProductVariant,
      RingTypes,
      StoneShapes,
      StoneTypes,
      ProductMetals,
      ProductRingTypes,
      ProductStoneShapes,
      ProductMetalsJunction,
      DiamondSizes,
      ProductDiamondSizes
    } = getModelInstance();
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Extract relationship IDs from request body
    const {
      ring_type_ids = [],
      stone_shape_ids = [],
      metal_ids = [],
      diamond_size_ids = [],
      nivoda_options_config,
      ...productData
    } = req.body;

    // Update slug if name changed
    let updateData = { ...productData };
    if (req.body.name && req.body.name !== product.name) {
      updateData.slug = await generateUniqueSlug(req.body.name, Product);
    }

    // Convert empty strings to null for numeric fields
    if (updateData.sale_price === '') {
      updateData.sale_price = null;
    }
    if (updateData.base_price === '') {
      updateData.base_price = null;
    }
    if (updateData.stock_quantity === '') {
      updateData.stock_quantity = null;
    }
    if (updateData.weight === '') {
      updateData.weight = null;
    }
    if (updateData.collection_id === '') {
      updateData.collection_id = null;
    }

    // Handle Made on Request fields
    if (updateData.is_made_on_request === false || updateData.is_made_on_request === 'false') {
      updateData.is_made_on_request = false;
      updateData.made_on_request_lead_time = null;
      updateData.made_on_request_message = null;
    }
    if (updateData.made_on_request_message === '') {
      updateData.made_on_request_message = null;
    }

    // Handle Nivoda options configuration - convert to JSON if provided and validate
    if (nivoda_options_config) {
      let parsedConfig = typeof nivoda_options_config === 'string'
        ? JSON.parse(nivoda_options_config)
        : nivoda_options_config;
      // Sanitize invalid options
      updateData.nivoda_options_config = validateNivodaOptions(parsedConfig);
    }

    await product.update(updateData);

    // Update many-to-many relationships
    const relationshipPromises = [];

    // Update ring type relationships
    if (ring_type_ids !== undefined) {
      // Delete existing ring type relationships
      await ProductRingTypes.destroy({
        where: { product_id: id }
      });

      // Create new ring type relationships
      if (ring_type_ids && ring_type_ids.length > 0) {
        const ringTypePromises = ring_type_ids.map(ringTypeId =>
          ProductRingTypes.create({
            product_id: id,
            ring_type_id: ringTypeId
          })
        );
        relationshipPromises.push(...ringTypePromises);
      }
    }

    // Update stone shape relationships
    if (stone_shape_ids !== undefined) {
      // Delete existing stone shape relationships
      await ProductStoneShapes.destroy({
        where: { product_id: id }
      });

      // Create new stone shape relationships
      if (stone_shape_ids && stone_shape_ids.length > 0) {
        const stoneShapePromises = stone_shape_ids.map(stoneShapeId =>
          ProductStoneShapes.create({
            product_id: id,
            stone_shape_id: stoneShapeId
          })
        );
        relationshipPromises.push(...stoneShapePromises);
      }
    }

    // Update metal relationships
    if (metal_ids !== undefined) {
      // Delete existing metal relationships
      await ProductMetalsJunction.destroy({
        where: { product_id: id }
      });

      // Create new metal relationships
      if (metal_ids && metal_ids.length > 0) {
        const metalPromises = metal_ids.map(metalId =>
          ProductMetalsJunction.create({
            product_id: id,
            metal_id: metalId
          })
        );
        relationshipPromises.push(...metalPromises);
      }
    }

    // Update diamond size relationships (for Engagement Rings)
    if (diamond_size_ids !== undefined && ProductDiamondSizes) {
      // Delete existing diamond size relationships
      await ProductDiamondSizes.destroy({
        where: { product_id: id }
      });

      // Create new diamond size relationships
      if (diamond_size_ids && diamond_size_ids.length > 0) {
        const diamondSizePromises = diamond_size_ids.map(diamondSizeId =>
          ProductDiamondSizes.create({
            product_id: id,
            diamond_size_id: diamondSizeId
          })
        );
        relationshipPromises.push(...diamondSizePromises);
      }
    }

    // Execute all relationship promises
    if (relationshipPromises.length > 0) {
      await Promise.all(relationshipPromises);
    }

    // Handle metal preview updates for existing images
    if (req.body.metalPreviewUpdates) {
      const metalPreviewUpdates = req.body.metalPreviewUpdates;
      console.log('[DEBUG] Received metalPreviewUpdates:', JSON.stringify(metalPreviewUpdates, null, 2));

      for (const metalId of Object.keys(metalPreviewUpdates)) {
        const imagesToUpdate = metalPreviewUpdates[metalId];
        console.log(`[DEBUG] Processing metal ${metalId} with ${imagesToUpdate.length} images`);

        // First, reset ALL images for this metal to not be preview
        await ProductImage.update(
          { is_metal_preview: false },
          {
            where: {
              product_id: id,
              metal_id: metalId
            }
          }
        );

        // Then set the selected one as preview
        for (const imageUpdate of imagesToUpdate) {
          console.log(`[DEBUG] Image ${imageUpdate.id}: is_metal_preview=${imageUpdate.is_metal_preview}`);
          if (imageUpdate.is_metal_preview === true && imageUpdate.id) {
            // First verify the image exists
            const existingImage = await ProductImage.findByPk(imageUpdate.id);
            console.log(`[DEBUG] Image ${imageUpdate.id} exists in DB:`, !!existingImage);

            if (existingImage) {
              const updateResult = await ProductImage.update(
                { is_metal_preview: true },
                {
                  where: {
                    id: imageUpdate.id
                  }
                }
              );
              console.log(`[DEBUG] Updated image ${imageUpdate.id} to preview. Rows affected: ${updateResult[0]}`);
            } else {
              console.log(`[DEBUG] ERROR: Image ${imageUpdate.id} NOT FOUND in database!`);
            }
          }
        }
      }
    }

    // Fetch updated product with relationships
    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Collection, as: 'collection', required: false },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'image_url', 'alt_text', 'is_primary', 'sort_order', 'metal_id', 'is_metal_preview', 'diamond_size_id', 'is_diamond_size_preview'],
          order: [['sort_order', 'ASC']]
        },
        {
          model: ProductVideo,
          as: 'videos',
          attributes: ['id', 'video_url', 'title', 'description', 'sort_order', 'metal_id'],
          order: [['sort_order', 'ASC']]
        },
        { model: ProductVariant, as: 'variants' },
        {
          model: RingTypes,
          as: 'ringTypes',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] }
        },
        {
          model: StoneShapes,
          as: 'stoneShapes',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] }
        },
        {
          model: StoneTypes,
          as: 'stoneType',
          attributes: ['id', 'name', 'slug'],
          required: false
        },
        {
          model: RingTypes,
          as: 'ringStyle1',
          attributes: ['id', 'name', 'slug'],
          required: false
        },
        {
          model: RingTypes,
          as: 'ringStyle2',
          attributes: ['id', 'name', 'slug'],
          required: false
        },
        {
          model: RingTypes,
          as: 'ringStyle3',
          attributes: ['id', 'name', 'slug'],
          required: false
        },
        {
          model: RingTypes,
          as: 'ringStyle4',
          attributes: ['id', 'name', 'slug'],
          required: false
        },
        {
          model: RingTypes,
          as: 'ringStyle5',
          attributes: ['id', 'name', 'slug'],
          required: false
        },
        {
          model: ProductMetals,
          as: 'metals',
          attributes: ['id', 'name', 'color_code'],
          through: { attributes: [] }
        },
        {
          model: DiamondSizes,
          as: 'diamondSizes',
          attributes: ['id', 'name', 'display_name', 'sort_order'],
          through: { attributes: [] },
          required: false
        }
      ]
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Update product with media uploads
const updateProductWithMedia = async (req, res) => {
  try {
    const {
      Product,
      Category,
      Collection,
      ProductImage,
      ProductVideo,
      ProductVariant,
      RingTypes,
      StoneShapes,
      StoneTypes,
      ProductMetals,
      ProductRingTypes,
      ProductStoneShapes,
      ProductMetalsJunction
    } = getModelInstance();

    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Parse form data
    const {
      name,
      description,
      short_description,
      base_price,
      sale_price,
      currency,
      category_id,
      collection_id,
      ring_type_ids,
      gemstone_ids,
      metal_ids,
      is_active,
      is_featured,
      in_stock,
      stock_quantity,
      weight,
      dimensions,
      care_instructions,
      warranty_info,
      meta_title,
      meta_description,
      nivoda_options_config
    } = req.body;

    // Update slug if name changed
    let updateData = { ...req.body };
    if (name && name !== product.name) {
      updateData.slug = await generateUniqueSlug(name, Product);
    }

    // Convert empty strings to null for numeric fields
    if (updateData.sale_price === '') {
      updateData.sale_price = null;
    }
    if (updateData.base_price === '') {
      updateData.base_price = null;
    }
    if (updateData.stock_quantity === '') {
      updateData.stock_quantity = null;
    }
    if (updateData.weight === '') {
      updateData.weight = null;
    }
    if (updateData.collection_id === '') {
      updateData.collection_id = null;
    }

    // Handle Made on Request fields
    if (updateData.is_made_on_request === false || updateData.is_made_on_request === 'false') {
      updateData.is_made_on_request = false;
      updateData.made_on_request_lead_time = null;
      updateData.made_on_request_message = null;
    }
    if (updateData.made_on_request_message === '') {
      updateData.made_on_request_message = null;
    }

    // Handle Nivoda options configuration - convert to JSON if provided and validate
    if (nivoda_options_config) {
      let parsedConfig = typeof nivoda_options_config === 'string'
        ? JSON.parse(nivoda_options_config)
        : nivoda_options_config;
      // Sanitize invalid options
      updateData.nivoda_options_config = validateNivodaOptions(parsedConfig);
    }

    // Update basic product info
    await product.update(updateData);

    // Process uploaded files if any
    if (req.files && req.files.length > 0) {
      const promises = [];
      let imageIndex = 0;
      let videoIndex = 0;

      // Get current max sort orders
      const maxImageSort = await ProductImage.max('sort_order', {
        where: { product_id: product.id }
      }) || -1;

      const maxVideoSort = await ProductVideo.max('sort_order', {
        where: { product_id: product.id }
      }) || -1;

      req.files.forEach(file => {
        const fileUrl = generateFileUrl(req, path.join('products', file.filename));

        // Extract metal_id from file fieldname if it contains metal-specific data
        // Format: media_metal_[metalId] for metal-specific uploads
        let metalId = null;
        if (file.fieldname && file.fieldname.includes('media_metal_')) {
          // Extract everything after 'media_metal_'
          const parts = file.fieldname.split('media_metal_');
          if (parts.length > 1) {
            // Clean up the metalId - remove any trailing special characters
            metalId = parts[1].trim() || null;
            // Validate it looks like a UUID (basic check)
            if (metalId && !metalId.match(/^[a-f0-9-]{36}$/i)) {
              console.warn(`Invalid metal_id format: ${metalId}, treating as general media`);
              metalId = null;
            }
          }
        }

        if (file.mimetype.startsWith('image/')) {
          promises.push(
            ProductImage.create({
              product_id: product.id,
              image_url: fileUrl,
              alt_text: product.name,
              is_primary: false, // Don't auto-set as primary when updating
              sort_order: maxImageSort + 1 + imageIndex,
              metal_id: metalId || null
            })
          );
          imageIndex++;
        } else if (file.mimetype.startsWith('video/')) {
          promises.push(
            ProductVideo.create({
              product_id: product.id,
              video_url: fileUrl,
              title: product.name,
              sort_order: maxVideoSort + 1 + videoIndex,
              metal_id: metalId || null
            })
          );
          videoIndex++;
        }
      });

      // Execute all media creation promises
      await Promise.all(promises);
    }

    // Fetch updated product with relationships
    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Collection, as: 'collection', required: false },
        { model: ProductImage, as: 'images', order: [['sort_order', 'ASC']] },
        { model: ProductVideo, as: 'videos', order: [['sort_order', 'ASC']] },
        { model: ProductVariant, as: 'variants' },
        { model: RingTypes, as: 'ringTypes' },
        { model: StoneShapes, as: 'stoneShapes' },
        { model: StoneTypes, as: 'stoneType', required: false },
        { model: RingTypes, as: 'ringStyle1', required: false },
        { model: RingTypes, as: 'ringStyle2', required: false },
        { model: RingTypes, as: 'ringStyle3', required: false },
        { model: RingTypes, as: 'ringStyle4', required: false },
        { model: RingTypes, as: 'ringStyle5', required: false },
        { model: ProductMetals, as: 'metals' }
      ]
    });

    res.json({
      success: true,
      message: 'Product updated successfully with media',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product with media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product with media',
      error: error.message
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { Product } = getModelInstance();
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

// Toggle product status
const toggleProductStatus = async (req, res) => {
  try {
    const { Product } = getModelInstance();
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.update({ is_active: !product.is_active });

    res.json({
      success: true,
      message: `Product ${product.is_active ? 'activated' : 'deactivated'} successfully`,
      data: { is_active: product.is_active }
    });
  } catch (error) {
    console.error('Error toggling product status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle product status',
      error: error.message
    });
  }
};

// Toggle featured status
const toggleFeaturedStatus = async (req, res) => {
  try {
    const { Product } = getModelInstance();
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.update({ is_featured: !product.is_featured });

    res.json({
      success: true,
      message: `Product ${product.is_featured ? 'featured' : 'unfeatured'} successfully`,
      data: { is_featured: product.is_featured }
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle featured status',
      error: error.message
    });
  }
};

// Get product categories and collections for dropdowns
const getProductOptions = async (req, res) => {
  try {
    const { Category, Collection, ProductMetals, ProductSizes, RingTypes, StoneShapes, StoneTypes, DiamondSizes } = getModelInstance();

    const [categories, collections, metals, sizes, ringTypes, stoneShapes, stoneTypes, diamondSizes] = await Promise.all([
      Category.findAll({
        where: { is_active: true },
        attributes: ['id', 'name', 'slug'],
        order: [['name', 'ASC']]
      }),
      Collection.findAll({
        where: { is_active: true },
        attributes: ['id', 'name', 'slug'],
        order: [['name', 'ASC']]
      }),
      ProductMetals.findAll({
        where: { is_active: true },
        attributes: ['id', 'name', 'color_code', 'price_multiplier'],
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      }),
      ProductSizes.findAll({
        where: { is_active: true },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ],
        attributes: ['id', 'size_name', 'size_value', 'category_id'],
        order: [['sort_order', 'ASC']]
      }),
      RingTypes.findAll({
        where: { is_active: true },
        attributes: ['id', 'name', 'slug', 'description'],
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      }),
      StoneShapes.findAll({
        where: { is_active: true },
        attributes: ['id', 'name', 'slug', 'description'],
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      }),
      StoneTypes.findAll({
        where: { is_active: true },
        attributes: ['id', 'name', 'slug', 'description'],
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      }),
      DiamondSizes ? DiamondSizes.findAll({
        where: { is_active: true },
        attributes: ['id', 'name', 'display_name', 'description', 'sort_order'],
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      }) : Promise.resolve([])
    ]);

    res.json({
      success: true,
      data: {
        categories,
        collections,
        metals,
        sizes,
        ringTypes,
        stoneShapes,
        stoneTypes,
        diamondSizes
      }
    });
  } catch (error) {
    console.error('Error fetching product options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product options',
      error: error.message
    });
  }
};

// Bulk actions
const bulkUpdateProducts = async (req, res) => {
  try {
    const { Product } = getModelInstance();
    const { productIds, action, value } = req.body;

    if (!productIds || !productIds.length || !action) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs and action are required'
      });
    }

    let updateData = {};

    switch (action) {
      case 'activate':
        updateData.is_active = true;
        break;
      case 'deactivate':
        updateData.is_active = false;
        break;
      case 'feature':
        updateData.is_featured = true;
        break;
      case 'unfeature':
        updateData.is_featured = false;
        break;
      case 'set_category':
        updateData.category_id = value;
        break;
      case 'set_collection':
        updateData.collection_id = value;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    await Product.update(updateData, {
      where: { id: { [Op.in]: productIds } }
    });

    res.json({
      success: true,
      message: `Successfully updated ${productIds.length} products`
    });
  } catch (error) {
    console.error('Error bulk updating products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update products',
      error: error.message
    });
  }
};

// Create new product with file uploads
const createProductWithMedia = async (req, res) => {
  try {
    console.log('DEBUG createProductWithMedia: Request received');
    console.log('DEBUG: Request body keys:', Object.keys(req.body));
    console.log('DEBUG: Files count:', req.files ? req.files.length : 0);
    console.log('DEBUG: name from body:', req.body.name);
    console.log('DEBUG: base_price from body:', req.body.base_price);
    console.log('DEBUG: category_id from body:', req.body.category_id);

    const {
      Product,
      Category,
      Collection,
      ProductImage,
      ProductVideo,
      ProductVariant,
      RingTypes,
      StoneShapes,
      StoneTypes,
      ProductMetals,
      ProductRingTypes,
      ProductStoneShapes,
      ProductMetalsJunction,
      DiamondSizes,
      ProductDiamondSizes
    } = getModelInstance();

    // Parse form data
    let {
      name,
      description,
      short_description,
      sku: providedSku,
      base_price,
      sale_price,
      currency = 'GBP',
      category_id,
      collection_id,
      ring_type_ids,
      stone_shape_ids,
      stone_type_id,
      ring_style_1_id,
      ring_style_2_id,
      ring_style_3_id,
      ring_style_4_id,
      ring_style_5_id,
      metal_ids,
      diamond_size_ids,
      jewelry_sub_type_id,
      is_active = true,
      is_featured = false,
      in_stock = true,
      stock_quantity = 0,
      weight,
      dimensions,
      care_instructions,
      warranty_info,
      meta_title,
      meta_description,
      nivoda_options_config
    } = req.body;

    // Convert empty strings to null for numeric fields
    if (sale_price === '') {
      sale_price = null;
    }
    if (stock_quantity === '') {
      stock_quantity = null;
    }
    if (weight === '') {
      weight = null;
    }
    if (collection_id === '') {
      collection_id = null;
    }
    if (stone_type_id === '') {
      stone_type_id = null;
    }
    if (jewelry_sub_type_id === '') {
      jewelry_sub_type_id = null;
    }

    // Parse array fields that come as JSON strings
    const parsedRingTypeIds = ring_type_ids ? JSON.parse(ring_type_ids) : [];
    const parsedStoneShapeIds = stone_shape_ids ? JSON.parse(stone_shape_ids) : [];
    const parsedMetalIds = metal_ids ? JSON.parse(metal_ids) : [];
    const parsedDiamondSizeIds = diamond_size_ids ? JSON.parse(diamond_size_ids) : [];

    // Handle ring style arrays - extract first element from each array or convert empty to null
    // Frontend sends arrays (ring_style_1_ids, ring_style_2_ids, etc.)
    // Database expects single IDs (ring_style_1_id, ring_style_2_id, etc.)
    let finalRingStyle1Id = null;
    let finalRingStyle2Id = null;
    let finalRingStyle3Id = null;
    let finalRingStyle4Id = null;
    let finalRingStyle5Id = null;

    // Try to parse as arrays first (new format from frontend)
    try {
      if (ring_style_1_id) {
        const parsed1 = typeof ring_style_1_id === 'string' ? JSON.parse(ring_style_1_id) : ring_style_1_id;
        finalRingStyle1Id = Array.isArray(parsed1) && parsed1.length > 0 ? parsed1[0] : (parsed1 || null);
      }
    } catch (e) {
      // If parsing fails, treat as single ID
      finalRingStyle1Id = ring_style_1_id === '' ? null : ring_style_1_id;
    }

    try {
      if (ring_style_2_id) {
        const parsed2 = typeof ring_style_2_id === 'string' ? JSON.parse(ring_style_2_id) : ring_style_2_id;
        finalRingStyle2Id = Array.isArray(parsed2) && parsed2.length > 0 ? parsed2[0] : (parsed2 || null);
      }
    } catch (e) {
      finalRingStyle2Id = ring_style_2_id === '' ? null : ring_style_2_id;
    }

    try {
      if (ring_style_3_id) {
        const parsed3 = typeof ring_style_3_id === 'string' ? JSON.parse(ring_style_3_id) : ring_style_3_id;
        finalRingStyle3Id = Array.isArray(parsed3) && parsed3.length > 0 ? parsed3[0] : (parsed3 || null);
      }
    } catch (e) {
      finalRingStyle3Id = ring_style_3_id === '' ? null : ring_style_3_id;
    }

    try {
      if (ring_style_4_id) {
        const parsed4 = typeof ring_style_4_id === 'string' ? JSON.parse(ring_style_4_id) : ring_style_4_id;
        finalRingStyle4Id = Array.isArray(parsed4) && parsed4.length > 0 ? parsed4[0] : (parsed4 || null);
      }
    } catch (e) {
      finalRingStyle4Id = ring_style_4_id === '' ? null : ring_style_4_id;
    }

    try {
      if (ring_style_5_id) {
        const parsed5 = typeof ring_style_5_id === 'string' ? JSON.parse(ring_style_5_id) : ring_style_5_id;
        finalRingStyle5Id = Array.isArray(parsed5) && parsed5.length > 0 ? parsed5[0] : (parsed5 || null);
      }
    } catch (e) {
      finalRingStyle5Id = ring_style_5_id === '' ? null : ring_style_5_id;
    }

    // Reassign to original variable names for use in product creation
    ring_style_1_id = finalRingStyle1Id;
    ring_style_2_id = finalRingStyle2Id;
    ring_style_3_id = finalRingStyle3Id;
    ring_style_4_id = finalRingStyle4Id;
    ring_style_5_id = finalRingStyle5Id;

    // Validation
    if (!name || !base_price || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, base price, and category are required'
      });
    }

    // Get category for SKU generation
    const category = await Category.findByPk(category_id);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    // Generate unique slug and use provided SKU or generate one
    const slug = await generateUniqueSlug(name, Product);
    const sku = providedSku && providedSku.trim() !== '' ? providedSku.trim() : generateSKU(name, category.slug);

    // Prepare Nivoda options configuration if provided and validate
    let processedNivodaConfig = null;
    if (nivoda_options_config) {
      processedNivodaConfig = typeof nivoda_options_config === 'string'
        ? JSON.parse(nivoda_options_config)
        : nivoda_options_config;
      // Sanitize invalid options
      processedNivodaConfig = validateNivodaOptions(processedNivodaConfig);
    }

    // Create product
    const product = await Product.create({
      name,
      slug,
      description,
      short_description,
      sku,
      base_price,
      sale_price,
      currency,
      category_id,
      collection_id: collection_id || null,
      jewelry_sub_type_id: jewelry_sub_type_id || null,
      stone_type_id: stone_type_id || null,
      ring_style_1_id: ring_style_1_id || null,
      ring_style_2_id: ring_style_2_id || null,
      ring_style_3_id: ring_style_3_id || null,
      ring_style_4_id: ring_style_4_id || null,
      ring_style_5_id: ring_style_5_id || null,
      is_active,
      is_featured,
      in_stock,
      stock_quantity,
      weight,
      dimensions,
      care_instructions,
      warranty_info,
      meta_title: meta_title || name,
      meta_description: meta_description || short_description,
      nivoda_options_config: processedNivodaConfig
    });

    // Process uploaded files
    const promises = [];

    if (req.files && req.files.length > 0) {
      let imageIndex = 0;
      let videoIndex = 0;
      const metalImageIndices = {}; // Track image indices for each metal

      console.log(`DEBUG: Processing ${req.files.length} files for product ${product.id}`);

      req.files.forEach(file => {
        const fileUrl = generateFileUrl(req, path.join('products', file.filename));

        // Extract metal_id from file fieldname if it contains metal-specific data
        // Format: media_metal_[metalId] for metal-specific uploads
        let metalId = null;
        console.log(`DEBUG: Processing file: ${file.originalname}, fieldname: ${file.fieldname}, mimetype: ${file.mimetype}`);

        if (file.fieldname && file.fieldname.includes('media_metal_')) {
          // Extract everything after 'media_metal_'
          const parts = file.fieldname.split('media_metal_');
          console.log(`DEBUG: Split result - parts.length: ${parts.length}, parts[1]: ${parts[1]}`);

          if (parts.length > 1) {
            // Clean up the metalId - remove any trailing special characters
            metalId = parts[1].trim() || null;
            console.log(`DEBUG: Extracted metalId: ${metalId}`);

            // Validate it looks like a UUID (basic check)
            if (metalId && !metalId.match(/^[a-f0-9-]{36}$/i)) {
              console.warn(`Invalid metal_id format: ${metalId}, treating as general media`);
              metalId = null;
            } else if (metalId) {
              console.log(`DEBUG: Valid metal_id format: ${metalId}`);
            }
          }
        } else {
          console.log(`DEBUG: This is a general file (no metal_id)`);
        }

        if (file.mimetype.startsWith('image/')) {
          // Initialize metal image index tracker if needed
          if (metalId && !metalImageIndices[metalId]) {
            metalImageIndices[metalId] = 0;
          }

          // Look for is_metal_preview flag in request body
          let isMetalPreview = false;
          if (metalId) {
            const currentMetalImageIndex = metalImageIndices[metalId];
            const previewFlagKey = `image_metal_${metalId}_${currentMetalImageIndex}_is_metal_preview`;
            isMetalPreview = req.body[previewFlagKey] === 'true' || req.body[previewFlagKey] === true;
            console.log(`DEBUG: Checking for ${previewFlagKey} = ${req.body[previewFlagKey]} => ${isMetalPreview}`);
            metalImageIndices[metalId]++;
          }

          promises.push(
            ProductImage.create({
              product_id: product.id,
              image_url: fileUrl,
              alt_text: name,
              is_primary: imageIndex === 0,
              sort_order: imageIndex,
              metal_id: metalId || null,
              is_metal_preview: isMetalPreview
            })
          );
          imageIndex++;
        } else if (file.mimetype.startsWith('video/')) {
          promises.push(
            ProductVideo.create({
              product_id: product.id,
              video_url: fileUrl,
              title: name,
              sort_order: videoIndex,
              metal_id: metalId || null
            })
          );
          videoIndex++;
        }
      });
    }

    // Create many-to-many relationships
    if (parsedRingTypeIds.length > 0) {
      parsedRingTypeIds.forEach(ringTypeId => {
        promises.push(
          ProductRingTypes.create({
            product_id: product.id,
            ring_type_id: ringTypeId
          })
        );
      });
    }

    if (parsedStoneShapeIds.length > 0) {
      parsedStoneShapeIds.forEach(stoneShapeId => {
        promises.push(
          ProductStoneShapes.create({
            product_id: product.id,
            stone_shape_id: stoneShapeId
          })
        );
      });
    }

    if (parsedMetalIds.length > 0) {
      parsedMetalIds.forEach(metalId => {
        promises.push(
          ProductMetalsJunction.create({
            product_id: product.id,
            metal_id: metalId
          })
        );
      });
    }

    // Diamond size relationships (for Engagement Rings)
    if (parsedDiamondSizeIds.length > 0 && ProductDiamondSizes) {
      parsedDiamondSizeIds.forEach(diamondSizeId => {
        promises.push(
          ProductDiamondSizes.create({
            product_id: product.id,
            diamond_size_id: diamondSizeId
          })
        );
      });
    }

    // Execute all promises
    await Promise.all(promises);

    // Fetch the complete product with relationships
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Collection, as: 'collection', required: false },
        { model: ProductImage, as: 'images' },
        { model: ProductVideo, as: 'videos' },
        { model: ProductVariant, as: 'variants' },
        { model: RingTypes, as: 'ringTypes' },
        { model: StoneShapes, as: 'stoneShapes' },
        { model: StoneTypes, as: 'stoneType', required: false },
        { model: RingTypes, as: 'ringStyle1', required: false },
        { model: RingTypes, as: 'ringStyle2', required: false },
        { model: RingTypes, as: 'ringStyle3', required: false },
        { model: RingTypes, as: 'ringStyle4', required: false },
        { model: RingTypes, as: 'ringStyle5', required: false },
        { model: ProductMetals, as: 'metals' },
        { model: DiamondSizes, as: 'diamondSizes', required: false }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully with media',
      data: createdProduct
    });
  } catch (error) {
    console.error('Error creating product with media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product with media',
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  createProductWithMedia,
  updateProduct,
  updateProductWithMedia,
  deleteProduct,
  toggleProductStatus,
  toggleFeaturedStatus,
  getProductOptions,
  bulkUpdateProducts
};
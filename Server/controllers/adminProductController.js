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
    const { Product, Category, Collection, ProductImage, ProductVideo, ProductVariant, RingTypes, StoneShapes, StoneTypes, ProductMetals } = getModelInstance();
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
          attributes: ['id', 'image_url', 'alt_text', 'is_primary', 'sort_order'],
          order: [['sort_order', 'ASC']]
        },
        {
          model: ProductVideo,
          as: 'videos',
          attributes: ['id', 'video_url', 'title', 'description', 'sort_order'],
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
      images = [],
      videos = [],
      variants = []
    } = req.body;

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
      meta_description: meta_description || short_description
    });

    // Create product images if provided
    if (images && images.length > 0) {
      const imagePromises = images.map((image, index) =>
        ProductImage.create({
          product_id: product.id,
          image_url: image.url,
          alt_text: image.alt_text || name,
          is_primary: index === 0,
          sort_order: index
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
          sort_order: index
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

    // Extract relationship IDs from request body
    const {
      ring_type_ids = [],
      stone_shape_ids = [],
      metal_ids = [],
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

    // Execute all relationship promises
    if (relationshipPromises.length > 0) {
      await Promise.all(relationshipPromises);
    }

    // Fetch updated product with relationships
    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Collection, as: 'collection', required: false },
        { model: ProductImage, as: 'images' },
        { model: ProductVideo, as: 'videos' },
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
      meta_description
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

        if (file.mimetype.startsWith('image/')) {
          promises.push(
            ProductImage.create({
              product_id: product.id,
              image_url: fileUrl,
              alt_text: product.name,
              is_primary: false, // Don't auto-set as primary when updating
              sort_order: maxImageSort + 1 + imageIndex
            })
          );
          imageIndex++;
        } else if (file.mimetype.startsWith('video/')) {
          promises.push(
            ProductVideo.create({
              product_id: product.id,
              video_url: fileUrl,
              title: product.name,
              sort_order: maxVideoSort + 1 + videoIndex
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
    const { Category, Collection, ProductMetals, ProductSizes, RingTypes, StoneShapes, StoneTypes } = getModelInstance();

    const [categories, collections, metals, sizes, ringTypes, stoneShapes, stoneTypes] = await Promise.all([
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
      })
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
        stoneTypes
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
      is_active = true,
      is_featured = false,
      in_stock = true,
      stock_quantity = 0,
      weight,
      dimensions,
      care_instructions,
      warranty_info,
      meta_title,
      meta_description
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

    // Parse array fields that come as JSON strings
    const parsedRingTypeIds = ring_type_ids ? JSON.parse(ring_type_ids) : [];
    const parsedStoneShapeIds = stone_shape_ids ? JSON.parse(stone_shape_ids) : [];
    const parsedMetalIds = metal_ids ? JSON.parse(metal_ids) : [];

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
      meta_description: meta_description || short_description
    });

    // Process uploaded files
    const promises = [];

    if (req.files && req.files.length > 0) {
      let imageIndex = 0;
      let videoIndex = 0;

      req.files.forEach(file => {
        const fileUrl = generateFileUrl(req, path.join('products', file.filename));

        if (file.mimetype.startsWith('image/')) {
          promises.push(
            ProductImage.create({
              product_id: product.id,
              image_url: fileUrl,
              alt_text: name,
              is_primary: imageIndex === 0,
              sort_order: imageIndex
            })
          );
          imageIndex++;
        } else if (file.mimetype.startsWith('video/')) {
          promises.push(
            ProductVideo.create({
              product_id: product.id,
              video_url: fileUrl,
              title: name,
              sort_order: videoIndex
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
        { model: ProductMetals, as: 'metals' }
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
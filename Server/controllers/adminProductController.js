const { getModels } = require('../models');
const { Op } = require('sequelize');
const { generateFileUrl } = require('../middleware/upload');
const path = require('path');

// Helper function to get models
const getModelInstance = () => {
  const models = getModels();
  if (!models.Product || !models.Category || !models.Collection || !models.ProductImage || !models.ProductVideo || !models.ProductVariant || !models.ProductMetals || !models.ProductSizes || !models.RingTypes || !models.Gemstones) {
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
    const { Product, Category, Collection, ProductImage, ProductVideo, ProductVariant, RingTypes, Gemstones, ProductMetals } = getModelInstance();
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
          model: Gemstones,
          as: 'gemstones',
          attributes: ['id', 'name', 'slug', 'color'],
          through: { attributes: [] }
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
      Gemstones,
      ProductMetals,
      ProductRingTypes,
      ProductGemstones,
      ProductMetalsJunction
    } = getModelInstance();

    const {
      name,
      description,
      short_description,
      base_price,
      sale_price,
      currency = 'GBP',
      category_id,
      collection_id,
      ring_type_ids = [],
      gemstone_ids = [],
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

    // Generate unique slug and SKU
    const slug = await generateUniqueSlug(name, Product);
    const sku = generateSKU(name, category.slug);

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

    // Gemstone relationships
    if (gemstone_ids && gemstone_ids.length > 0) {
      const gemstonePromises = gemstone_ids.map(gemstoneId =>
        ProductGemstones.create({
          product_id: product.id,
          gemstone_id: gemstoneId
        })
      );
      relationshipPromises.push(...gemstonePromises);
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
        { model: Gemstones, as: 'gemstones' },
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
      Gemstones,
      ProductMetals,
      ProductRingTypes,
      ProductGemstones,
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
      gemstone_ids = [],
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

    // Update gemstone relationships
    if (gemstone_ids !== undefined) {
      // Delete existing gemstone relationships
      await ProductGemstones.destroy({
        where: { product_id: id }
      });

      // Create new gemstone relationships
      if (gemstone_ids && gemstone_ids.length > 0) {
        const gemstonePromises = gemstone_ids.map(gemstoneId =>
          ProductGemstones.create({
            product_id: id,
            gemstone_id: gemstoneId
          })
        );
        relationshipPromises.push(...gemstonePromises);
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
          model: Gemstones,
          as: 'gemstones',
          attributes: ['id', 'name', 'slug', 'color'],
          through: { attributes: [] }
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
      Gemstones,
      ProductMetals,
      ProductRingTypes,
      ProductGemstones,
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
        { model: Gemstones, as: 'gemstones' },
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
    const { Category, Collection, ProductMetals, ProductSizes, RingTypes, Gemstones } = getModelInstance();

    const [categories, collections, metals, sizes, ringTypes, gemstones] = await Promise.all([
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
      Gemstones.findAll({
        where: { is_active: true },
        attributes: ['id', 'name', 'slug', 'color', 'price_per_carat'],
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
        gemstones
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
      Gemstones,
      ProductMetals,
      ProductRingTypes,
      ProductGemstones,
      ProductMetalsJunction
    } = getModelInstance();

    // Parse form data
    const {
      name,
      description,
      short_description,
      base_price,
      sale_price,
      currency = 'GBP',
      category_id,
      collection_id,
      ring_type_ids,
      gemstone_ids,
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

    // Parse array fields that come as JSON strings
    const parsedRingTypeIds = ring_type_ids ? JSON.parse(ring_type_ids) : [];
    const parsedGemstoneIds = gemstone_ids ? JSON.parse(gemstone_ids) : [];
    const parsedMetalIds = metal_ids ? JSON.parse(metal_ids) : [];

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

    // Generate unique slug and SKU
    const slug = await generateUniqueSlug(name, Product);
    const sku = generateSKU(name, category.slug);

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

    if (parsedGemstoneIds.length > 0) {
      parsedGemstoneIds.forEach(gemstoneId => {
        promises.push(
          ProductGemstones.create({
            product_id: product.id,
            gemstone_id: gemstoneId
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
        { model: Gemstones, as: 'gemstones' },
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
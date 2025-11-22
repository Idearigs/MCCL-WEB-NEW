const { getModels } = require('../models');

// Helper function to get models
const getModelInstance = () => {
  const models = getModels();
  if (!models.MarketingContent || !models.Product) {
    throw new Error('Models not initialized properly');
  }
  return models;
};

/**
 * Get all marketing content (public - featured only)
 */
exports.getMarketingContent = async (req, res) => {
  try {
    const { MarketingContent, Product } = getModelInstance();
    const { limit = 10, offset = 0, featured_only = true } = req.query;

    const where = { is_active: true };
    if (featured_only === 'true') {
      where.is_featured = true;
    }

    const { count, rows } = await MarketingContent.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug', 'base_price', 'sale_price', 'currency'],
          required: false,
        },
      ],
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        marketing_content: rows,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error fetching marketing content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching marketing content',
      error: error.message,
    });
  }
};

/**
 * Get single marketing content by ID
 */
exports.getMarketingContentById = async (req, res) => {
  try {
    const { MarketingContent, Product } = getModelInstance();
    const { id } = req.params;

    const marketingContent = await MarketingContent.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug', 'base_price', 'sale_price', 'currency', 'description'],
          required: false,
        },
      ],
    });

    if (!marketingContent) {
      return res.status(404).json({
        success: false,
        message: 'Marketing content not found',
      });
    }

    res.json({
      success: true,
      data: marketingContent,
    });
  } catch (error) {
    console.error('Error fetching marketing content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching marketing content',
      error: error.message,
    });
  }
};

/**
 * Create new marketing content (admin only)
 */
exports.createMarketingContent = async (req, res) => {
  try {
    const { MarketingContent, Product } = getModelInstance();
    const { title, description, product_id, video_url, thumbnail_image, is_featured, sort_order } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    const marketingContent = await MarketingContent.create({
      title,
      description,
      product_id,
      video_url,
      thumbnail_image,
      is_featured: is_featured || false,
      sort_order: sort_order || 0,
    });

    const result = await MarketingContent.findByPk(marketingContent.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug', 'base_price', 'sale_price', 'currency'],
          required: false,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Marketing content created successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error creating marketing content:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating marketing content',
      error: error.message,
    });
  }
};

/**
 * Update marketing content (admin only)
 */
exports.updateMarketingContent = async (req, res) => {
  try {
    const { MarketingContent, Product } = getModelInstance();
    const { id } = req.params;
    const { title, description, product_id, video_url, thumbnail_image, is_active, is_featured, sort_order } = req.body;

    const marketingContent = await MarketingContent.findByPk(id);

    if (!marketingContent) {
      return res.status(404).json({
        success: false,
        message: 'Marketing content not found',
      });
    }

    await marketingContent.update({
      title: title !== undefined ? title : marketingContent.title,
      description: description !== undefined ? description : marketingContent.description,
      product_id: product_id !== undefined ? product_id : marketingContent.product_id,
      video_url: video_url !== undefined ? video_url : marketingContent.video_url,
      thumbnail_image: thumbnail_image !== undefined ? thumbnail_image : marketingContent.thumbnail_image,
      is_active: is_active !== undefined ? is_active : marketingContent.is_active,
      is_featured: is_featured !== undefined ? is_featured : marketingContent.is_featured,
      sort_order: sort_order !== undefined ? sort_order : marketingContent.sort_order,
    });

    const result = await MarketingContent.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug', 'base_price', 'sale_price', 'currency'],
          required: false,
        },
      ],
    });

    res.json({
      success: true,
      message: 'Marketing content updated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error updating marketing content:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating marketing content',
      error: error.message,
    });
  }
};

/**
 * Delete marketing content (admin only)
 */
exports.deleteMarketingContent = async (req, res) => {
  try {
    const { MarketingContent } = getModelInstance();
    const { id } = req.params;

    const marketingContent = await MarketingContent.findByPk(id);

    if (!marketingContent) {
      return res.status(404).json({
        success: false,
        message: 'Marketing content not found',
      });
    }

    await marketingContent.destroy();

    res.json({
      success: true,
      message: 'Marketing content deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting marketing content:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting marketing content',
      error: error.message,
    });
  }
};

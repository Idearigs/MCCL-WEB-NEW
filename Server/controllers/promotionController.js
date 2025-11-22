const { getModels } = require('../models');

const getModelInstance = () => {
  return getModels();
};

exports.getPromotions = async (req, res) => {
  try {
    const { Promotion, Product } = getModelInstance();
    const { type = 'both', active_only = true } = req.query;

    const where = {};
    if (active_only === 'true') {
      where.is_active = true;
    }

    let include = [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'base_price', 'sale_price', 'currency']
      }
    ];

    const promotions = await Promotion.findAll({
      where,
      include,
      order: [['sort_order', 'ASC']],
      raw: false
    });

    // Filter based on type
    let filteredPromotions = promotions;
    if (type === 'popup') {
      filteredPromotions = promotions.filter(p => p.show_popup);
    } else if (type === 'banner') {
      filteredPromotions = promotions.filter(p => p.show_banner);
    }

    return res.json({
      success: true,
      data: {
        promotions: filteredPromotions,
        count: filteredPromotions.length
      }
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch promotions',
      error: error.message
    });
  }
};

exports.getPromotionById = async (req, res) => {
  try {
    const { Promotion, Product } = getModelInstance();
    const { id } = req.params;

    const promotion = await Promotion.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug', 'base_price', 'sale_price', 'currency']
        }
      ]
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    return res.json({
      success: true,
      data: { promotion }
    });
  } catch (error) {
    console.error('Error fetching promotion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch promotion',
      error: error.message
    });
  }
};

exports.createPromotion = async (req, res) => {
  try {
    const { Promotion } = getModelInstance();
    const {
      title,
      description,
      product_id,
      discount_percentage,
      banner_text,
      banner_text_1,
      banner_text_2,
      banner_text_3,
      banner_text_4,
      banner_text_5,
      image_url,
      show_popup,
      show_banner,
      sort_order
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const promotion = await Promotion.create({
      title,
      description: description || null,
      product_id: product_id && product_id.trim() ? product_id : null,
      discount_percentage: discount_percentage ? parseInt(discount_percentage) : null,
      banner_text: banner_text || null,
      banner_text_1: banner_text_1 || null,
      banner_text_2: banner_text_2 || null,
      banner_text_3: banner_text_3 || null,
      banner_text_4: banner_text_4 || null,
      banner_text_5: banner_text_5 || null,
      image_url: image_url || null,
      show_popup: show_popup !== false,
      show_banner: show_banner !== false,
      sort_order: sort_order || 0
    });

    return res.status(201).json({
      success: true,
      data: { promotion },
      message: 'Promotion created successfully'
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create promotion',
      error: error.message
    });
  }
};

exports.updatePromotion = async (req, res) => {
  try {
    const { Promotion } = getModelInstance();
    const { id } = req.params;
    const updates = req.body;

    const promotion = await Promotion.findByPk(id);
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    // Handle empty strings - convert to null for UUID and optional fields
    const cleanUpdates = {
      ...updates,
      product_id: updates.product_id && updates.product_id.trim() ? updates.product_id : null,
      discount_percentage: updates.discount_percentage ? parseInt(updates.discount_percentage) : null,
      description: updates.description || null,
      banner_text: updates.banner_text || null,
      banner_text_1: updates.banner_text_1 || null,
      banner_text_2: updates.banner_text_2 || null,
      banner_text_3: updates.banner_text_3 || null,
      banner_text_4: updates.banner_text_4 || null,
      banner_text_5: updates.banner_text_5 || null,
      image_url: updates.image_url || null
    };

    await promotion.update(cleanUpdates);

    return res.json({
      success: true,
      data: { promotion },
      message: 'Promotion updated successfully'
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update promotion',
      error: error.message
    });
  }
};

exports.deletePromotion = async (req, res) => {
  try {
    const { Promotion } = getModelInstance();
    const { id } = req.params;

    const promotion = await Promotion.findByPk(id);
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    await promotion.destroy();

    return res.json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete promotion',
      error: error.message
    });
  }
};

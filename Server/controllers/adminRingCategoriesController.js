const { getModels } = require('../models');

// Get all ring types
const getRingTypes = async (req, res) => {
  try {
    const { RingTypes } = getModels();

    const ringTypes = await RingTypes.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: ringTypes,
      message: 'Ring types retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching ring types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ring types',
      error: error.message
    });
  }
};

// Get all gemstones
const getGemstones = async (req, res) => {
  try {
    const { Gemstones } = getModels();

    const gemstones = await Gemstones.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: gemstones,
      message: 'Gemstones retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching gemstones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gemstones',
      error: error.message
    });
  }
};

// Get all metals
const getMetals = async (req, res) => {
  try {
    const { ProductMetals } = getModels();

    const metals = await ProductMetals.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: metals,
      message: 'Metals retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching metals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metals',
      error: error.message
    });
  }
};

// Get all categories (for the main category dropdown)
const getCategories = async (req, res) => {
  try {
    const { Category } = getModels();

    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get all collections
const getCollections = async (req, res) => {
  try {
    const { Collection } = getModels();

    const collections = await Collection.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: collections,
      message: 'Collections retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collections',
      error: error.message
    });
  }
};

// Create ring type
const createRingType = async (req, res) => {
  try {
    const { RingTypes } = getModels();
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Ring type name is required'
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const ringType = await RingTypes.create({
      name,
      slug,
      description,
      is_active: true
    });

    res.status(201).json({
      success: true,
      data: ringType,
      message: 'Ring type created successfully'
    });
  } catch (error) {
    console.error('Error creating ring type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ring type',
      error: error.message
    });
  }
};

// Create gemstone
const createGemstone = async (req, res) => {
  try {
    const { Gemstones } = getModels();
    const { name, description, color, hardness, price_per_carat } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Gemstone name is required'
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const gemstone = await Gemstones.create({
      name,
      slug,
      description,
      color,
      hardness,
      price_per_carat,
      is_active: true
    });

    res.status(201).json({
      success: true,
      data: gemstone,
      message: 'Gemstone created successfully'
    });
  } catch (error) {
    console.error('Error creating gemstone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gemstone',
      error: error.message
    });
  }
};

// Create metal
const createMetal = async (req, res) => {
  try {
    const { ProductMetals } = getModels();
    const { name, color_code, price_multiplier } = req.body;

    if (!name || !color_code) {
      return res.status(400).json({
        success: false,
        message: 'Metal name and color code are required'
      });
    }

    const metal = await ProductMetals.create({
      name,
      color_code,
      price_multiplier: price_multiplier || 1.0,
      is_active: true
    });

    res.status(201).json({
      success: true,
      data: metal,
      message: 'Metal created successfully'
    });
  } catch (error) {
    console.error('Error creating metal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create metal',
      error: error.message
    });
  }
};

module.exports = {
  getRingTypes,
  getGemstones,
  getMetals,
  getCategories,
  getCollections,
  createRingType,
  createGemstone,
  createMetal
};
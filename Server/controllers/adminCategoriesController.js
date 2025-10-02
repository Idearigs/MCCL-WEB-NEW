const { getModels } = require('../models');
const { seedHierarchicalCategories } = require('../scripts/seed-hierarchical-categories');
const { syncSchema } = require('../scripts/sync-schema');

// Helper function to get models
const getModelInstance = () => {
  const models = getModels();
  if (!models.Category || !models.RingTypes || !models.Gemstones || !models.ProductMetals || !models.Collection) {
    throw new Error('Models not initialized properly');
  }
  return models;
};

// Categories Controllers
const getCategories = async (req, res) => {
  try {
    const { Category } = getModelInstance();

    // Check if this is a hierarchical request
    const { hierarchical, level } = req.query;

    let queryOptions = {
      order: [['level', 'ASC'], ['sort_order', 'ASC'], ['name', 'ASC']]
    };

    // If hierarchical is requested, include children
    if (hierarchical === 'true') {
      queryOptions.include = [
        {
          model: Category,
          as: 'children',
          include: [
            {
              model: Category,
              as: 'children'
            }
          ]
        },
        {
          model: Category,
          as: 'parent'
        }
      ];

      // Only get top-level categories if hierarchical
      queryOptions.where = { parent_id: null };
    }

    // Filter by level if specified
    if (level !== undefined) {
      queryOptions.where = { ...queryOptions.where, level: parseInt(level) };
    }

    const categories = await Category.findAll(queryOptions);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      message: 'Failed to fetch categories',
      error: error.message,
      details: 'Check if database schema is up to date'
    });
  }
};

const getCategoryBySlug = async (req, res) => {
  try {
    const { Category } = getModelInstance();
    const category = await Category.findOne({
      where: { slug: req.params.slug }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    res.status(500).json({ message: 'Failed to fetch category' });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { Category } = getModelInstance();
    // Check if the ID is a valid UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ message: 'Invalid category ID format' });
    }
    
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Failed to fetch category' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { Category } = getModelInstance();
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Category name or slug already exists' });
    }
    res.status(500).json({ message: 'Failed to create category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { Category } = getModelInstance();
    const [updatedRowsCount] = await Category.update(req.body, {
      where: { id: req.params.id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const updatedCategory = await Category.findByPk(req.params.id);
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Category name or slug already exists' });
    }
    res.status(500).json({ message: 'Failed to update category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { Category } = getModelInstance();
    const deletedRowsCount = await Category.destroy({
      where: { id: req.params.id }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
};

// Ring Types Controllers
const getRingTypes = async (req, res) => {
  try {
    const { RingTypes } = getModelInstance();
    const ringTypes = await RingTypes.findAll({
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });
    res.json(ringTypes);
  } catch (error) {
    console.error('Error fetching ring types:', error);
    res.status(500).json({ message: 'Failed to fetch ring types' });
  }
};

const getRingTypeById = async (req, res) => {
  try {
    const { RingTypes } = getModelInstance();
    const ringType = await RingTypes.findByPk(req.params.id);

    if (!ringType) {
      return res.status(404).json({ message: 'Ring type not found' });
    }

    res.json(ringType);
  } catch (error) {
    console.error('Error fetching ring type:', error);
    res.status(500).json({ message: 'Failed to fetch ring type' });
  }
};

const createRingType = async (req, res) => {
  try {
    const { RingTypes } = getModelInstance();
    const ringType = await RingTypes.create(req.body);
    res.status(201).json(ringType);
  } catch (error) {
    console.error('Error creating ring type:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Ring type name or slug already exists' });
    }
    res.status(500).json({ message: 'Failed to create ring type' });
  }
};

const updateRingType = async (req, res) => {
  try {
    const { RingTypes } = getModelInstance();
    const [updatedRowsCount] = await RingTypes.update(req.body, {
      where: { id: req.params.id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ message: 'Ring type not found' });
    }

    const updatedRingType = await RingTypes.findByPk(req.params.id);
    res.json(updatedRingType);
  } catch (error) {
    console.error('Error updating ring type:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Ring type name or slug already exists' });
    }
    res.status(500).json({ message: 'Failed to update ring type' });
  }
};

const deleteRingType = async (req, res) => {
  try {
    const { RingTypes } = getModelInstance();
    const deletedRowsCount = await RingTypes.destroy({
      where: { id: req.params.id }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({ message: 'Ring type not found' });
    }

    res.json({ message: 'Ring type deleted successfully' });
  } catch (error) {
    console.error('Error deleting ring type:', error);
    res.status(500).json({ message: 'Failed to delete ring type' });
  }
};

// Gemstones Controllers
const getGemstones = async (req, res) => {
  try {
    const { Gemstones } = getModelInstance();
    const gemstones = await Gemstones.findAll({
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });
    res.json(gemstones);
  } catch (error) {
    console.error('Error fetching gemstones:', error);
    res.status(500).json({ message: 'Failed to fetch gemstones' });
  }
};

const getGemstoneById = async (req, res) => {
  try {
    const { Gemstones } = getModelInstance();
    const gemstone = await Gemstones.findByPk(req.params.id);

    if (!gemstone) {
      return res.status(404).json({ message: 'Gemstone not found' });
    }

    res.json(gemstone);
  } catch (error) {
    console.error('Error fetching gemstone:', error);
    res.status(500).json({ message: 'Failed to fetch gemstone' });
  }
};

const createGemstone = async (req, res) => {
  try {
    const { Gemstones } = getModelInstance();
    const gemstone = await Gemstones.create(req.body);
    res.status(201).json(gemstone);
  } catch (error) {
    console.error('Error creating gemstone:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Gemstone name or slug already exists' });
    }
    res.status(500).json({ message: 'Failed to create gemstone' });
  }
};

const updateGemstone = async (req, res) => {
  try {
    const { Gemstones } = getModelInstance();
    const [updatedRowsCount] = await Gemstones.update(req.body, {
      where: { id: req.params.id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ message: 'Gemstone not found' });
    }

    const updatedGemstone = await Gemstones.findByPk(req.params.id);
    res.json(updatedGemstone);
  } catch (error) {
    console.error('Error updating gemstone:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Gemstone name or slug already exists' });
    }
    res.status(500).json({ message: 'Failed to update gemstone' });
  }
};

const deleteGemstone = async (req, res) => {
  try {
    const { Gemstones } = getModelInstance();
    const deletedRowsCount = await Gemstones.destroy({
      where: { id: req.params.id }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({ message: 'Gemstone not found' });
    }

    res.json({ message: 'Gemstone deleted successfully' });
  } catch (error) {
    console.error('Error deleting gemstone:', error);
    res.status(500).json({ message: 'Failed to delete gemstone' });
  }
};

// Metals Controllers
const getMetals = async (req, res) => {
  try {
    const { ProductMetals } = getModelInstance();
    const metals = await ProductMetals.findAll({
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });
    res.json(metals);
  } catch (error) {
    console.error('Error fetching metals:', error);
    res.status(500).json({ message: 'Failed to fetch metals' });
  }
};

const getMetalById = async (req, res) => {
  try {
    const { ProductMetals } = getModelInstance();
    const metal = await ProductMetals.findByPk(req.params.id);

    if (!metal) {
      return res.status(404).json({ message: 'Metal not found' });
    }

    res.json(metal);
  } catch (error) {
    console.error('Error fetching metal:', error);
    res.status(500).json({ message: 'Failed to fetch metal' });
  }
};

const createMetal = async (req, res) => {
  try {
    const { ProductMetals } = getModelInstance();
    const metal = await ProductMetals.create(req.body);
    res.status(201).json(metal);
  } catch (error) {
    console.error('Error creating metal:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Metal name already exists' });
    }
    res.status(500).json({ message: 'Failed to create metal' });
  }
};

const updateMetal = async (req, res) => {
  try {
    const { ProductMetals } = getModelInstance();
    const [updatedRowsCount] = await ProductMetals.update(req.body, {
      where: { id: req.params.id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ message: 'Metal not found' });
    }

    const updatedMetal = await ProductMetals.findByPk(req.params.id);
    res.json(updatedMetal);
  } catch (error) {
    console.error('Error updating metal:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Metal name already exists' });
    }
    res.status(500).json({ message: 'Failed to update metal' });
  }
};

const deleteMetal = async (req, res) => {
  try {
    const { ProductMetals } = getModelInstance();
    const deletedRowsCount = await ProductMetals.destroy({
      where: { id: req.params.id }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({ message: 'Metal not found' });
    }

    res.json({ message: 'Metal deleted successfully' });
  } catch (error) {
    console.error('Error deleting metal:', error);
    res.status(500).json({ message: 'Failed to delete metal' });
  }
};

// Collections Controllers
const getCollections = async (req, res) => {
  try {
    const { Collection } = getModelInstance();
    const collections = await Collection.findAll({
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ message: 'Failed to fetch collections' });
  }
};

const getCollectionById = async (req, res) => {
  try {
    const { Collection } = getModelInstance();
    const collection = await Collection.findByPk(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    res.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ message: 'Failed to fetch collection' });
  }
};

const createCollection = async (req, res) => {
  try {
    const { Collection } = getModelInstance();
    const collection = await Collection.create(req.body);
    res.status(201).json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Collection name or slug already exists' });
    }
    res.status(500).json({ message: 'Failed to create collection' });
  }
};

const updateCollection = async (req, res) => {
  try {
    const { Collection } = getModelInstance();
    const [updatedRowsCount] = await Collection.update(req.body, {
      where: { id: req.params.id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const updatedCollection = await Collection.findByPk(req.params.id);
    res.json(updatedCollection);
  } catch (error) {
    console.error('Error updating collection:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Collection name or slug already exists' });
    }
    res.status(500).json({ message: 'Failed to update collection' });
  }
};

const deleteCollection = async (req, res) => {
  try {
    const { Collection } = getModelInstance();
    const deletedRowsCount = await Collection.destroy({
      where: { id: req.params.id }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ message: 'Failed to delete collection' });
  }
};

// Schema sync endpoint
const syncSchemaEndpoint = async (req, res) => {
  try {
    console.log('Starting schema synchronization from endpoint...');
    await syncSchema();
    res.json({ success: true, message: 'Schema synchronized successfully!' });
  } catch (error) {
    console.error('Schema sync failed:', error);
    res.status(500).json({ success: false, message: 'Schema sync failed', error: error.message });
  }
};

// Temporary seeding endpoint
const seedHierarchical = async (req, res) => {
  try {
    console.log('Starting hierarchical category seeding from endpoint...');
    await seedHierarchicalCategories();
    res.json({ success: true, message: 'Hierarchical categories seeded successfully!' });
  } catch (error) {
    console.error('Seeding failed - full error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    res.status(500).json({
      success: false,
      message: 'Seeding failed',
      error: error.message,
      errorName: error.name,
      validationErrors: error.errors || null
    });
  }
};

module.exports = {
  // Categories
  getCategories,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,

  // Ring Types
  getRingTypes,
  getRingTypeById,
  createRingType,
  updateRingType,
  deleteRingType,

  // Gemstones
  getGemstones,
  getGemstoneById,
  createGemstone,
  updateGemstone,
  deleteGemstone,

  // Metals
  getMetals,
  getMetalById,
  createMetal,
  updateMetal,
  deleteMetal,

  // Collections
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,

  // Seeding
  seedHierarchical,
  syncSchemaEndpoint
};
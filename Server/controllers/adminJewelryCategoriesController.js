const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../config/database');
const { getModels } = require('../models');

// =====================================================
// JEWELRY TYPES (Main Categories: Rings, Earrings, Necklaces, Bracelets)
// =====================================================

// Get all jewelry types
const getJewelryTypes = asyncHandler(async (req, res) => {
  const { JewelryType, JewelrySubType } = getModels();

  const jewelryTypes = await JewelryType.findAll({
    order: [['sort_order', 'ASC'], ['name', 'ASC']],
    include: [
      {
        model: JewelrySubType,
        as: 'subTypes',
        where: { is_active: true },
        required: false,
        order: [['sort_order', 'ASC']]
      }
    ]
  });

  res.json({
    success: true,
    data: jewelryTypes
  });
});

// Get jewelry type by ID
const getJewelryTypeById = asyncHandler(async (req, res) => {
  const { JewelryType, JewelrySubType } = getModels();
  const { id } = req.params;

  const jewelryType = await JewelryType.findByPk(id, {
    include: [
      {
        model: JewelrySubType,
        as: 'subTypes',
        order: [['sort_order', 'ASC']]
      }
    ]
  });

  if (!jewelryType) {
    return res.status(404).json({
      success: false,
      message: 'Jewelry type not found'
    });
  }

  res.json({
    success: true,
    data: jewelryType
  });
});

// Create jewelry type
const createJewelryType = asyncHandler(async (req, res) => {
  const { JewelryType } = getModels();
  const { name, slug, description, icon, is_active, sort_order } = req.body;

  const jewelryType = await JewelryType.create({
    name,
    slug,
    description,
    icon,
    is_active: is_active !== undefined ? is_active : true,
    sort_order: sort_order || 0
  });

  logger.info(`Jewelry type created: ${jewelryType.name} by admin: ${req.admin.email}`);

  res.status(201).json({
    success: true,
    message: 'Jewelry type created successfully',
    data: jewelryType
  });
});

// Update jewelry type
const updateJewelryType = asyncHandler(async (req, res) => {
  const { JewelryType } = getModels();
  const { id } = req.params;
  const { name, slug, description, icon, is_active, sort_order } = req.body;

  const jewelryType = await JewelryType.findByPk(id);

  if (!jewelryType) {
    return res.status(404).json({
      success: false,
      message: 'Jewelry type not found'
    });
  }

  await jewelryType.update({
    name: name !== undefined ? name : jewelryType.name,
    slug: slug !== undefined ? slug : jewelryType.slug,
    description: description !== undefined ? description : jewelryType.description,
    icon: icon !== undefined ? icon : jewelryType.icon,
    is_active: is_active !== undefined ? is_active : jewelryType.is_active,
    sort_order: sort_order !== undefined ? sort_order : jewelryType.sort_order
  });

  logger.info(`Jewelry type updated: ${jewelryType.name} by admin: ${req.admin.email}`);

  res.json({
    success: true,
    message: 'Jewelry type updated successfully',
    data: jewelryType
  });
});

// Delete jewelry type
const deleteJewelryType = asyncHandler(async (req, res) => {
  const { JewelryType } = getModels();
  const { id } = req.params;

  const jewelryType = await JewelryType.findByPk(id);

  if (!jewelryType) {
    return res.status(404).json({
      success: false,
      message: 'Jewelry type not found'
    });
  }

  await jewelryType.destroy();
  logger.info(`Jewelry type deleted: ${jewelryType.name} by admin: ${req.admin.email}`);

  res.json({
    success: true,
    message: 'Jewelry type deleted successfully'
  });
});

// =====================================================
// JEWELRY SUB TYPES (Engagement Rings, Wedding Rings, etc.)
// =====================================================

// Get all jewelry sub types
const getJewelrySubTypes = asyncHandler(async (req, res) => {
  const { JewelrySubType, JewelryType } = getModels();
  const { jewelry_type_id } = req.query;

  const where = {};
  if (jewelry_type_id) {
    where.jewelry_type_id = jewelry_type_id;
  }

  const jewelrySubTypes = await JewelrySubType.findAll({
    where,
    order: [['sort_order', 'ASC'], ['name', 'ASC']],
    include: [
      {
        model: JewelryType,
        as: 'jewelryType',
        attributes: ['id', 'name', 'slug']
      }
    ]
  });

  res.json({
    success: true,
    data: jewelrySubTypes
  });
});

// Get jewelry sub type by ID
const getJewelrySubTypeById = asyncHandler(async (req, res) => {
  const { JewelrySubType, JewelryType } = getModels();
  const { id } = req.params;

  const jewelrySubType = await JewelrySubType.findByPk(id, {
    include: [
      {
        model: JewelryType,
        as: 'jewelryType',
        attributes: ['id', 'name', 'slug']
      }
    ]
  });

  if (!jewelrySubType) {
    return res.status(404).json({
      success: false,
      message: 'Jewelry sub type not found'
    });
  }

  res.json({
    success: true,
    data: jewelrySubType
  });
});

// Create jewelry sub type
const createJewelrySubType = asyncHandler(async (req, res) => {
  const { JewelrySubType } = getModels();
  const { jewelry_type_id, name, slug, description, image_url, is_active, sort_order } = req.body;

  if (!jewelry_type_id) {
    return res.status(400).json({
      success: false,
      message: 'jewelry_type_id is required'
    });
  }

  const jewelrySubType = await JewelrySubType.create({
    jewelry_type_id,
    name,
    slug,
    description,
    image_url,
    is_active: is_active !== undefined ? is_active : true,
    sort_order: sort_order || 0
  });

  logger.info(`Jewelry sub type created: ${jewelrySubType.name} by admin: ${req.admin.email}`);

  res.status(201).json({
    success: true,
    message: 'Jewelry sub type created successfully',
    data: jewelrySubType
  });
});

// Update jewelry sub type
const updateJewelrySubType = asyncHandler(async (req, res) => {
  const { JewelrySubType } = getModels();
  const { id } = req.params;
  const { jewelry_type_id, name, slug, description, image_url, is_active, sort_order } = req.body;

  const jewelrySubType = await JewelrySubType.findByPk(id);

  if (!jewelrySubType) {
    return res.status(404).json({
      success: false,
      message: 'Jewelry sub type not found'
    });
  }

  await jewelrySubType.update({
    jewelry_type_id: jewelry_type_id !== undefined ? jewelry_type_id : jewelrySubType.jewelry_type_id,
    name: name !== undefined ? name : jewelrySubType.name,
    slug: slug !== undefined ? slug : jewelrySubType.slug,
    description: description !== undefined ? description : jewelrySubType.description,
    image_url: image_url !== undefined ? image_url : jewelrySubType.image_url,
    is_active: is_active !== undefined ? is_active : jewelrySubType.is_active,
    sort_order: sort_order !== undefined ? sort_order : jewelrySubType.sort_order
  });

  logger.info(`Jewelry sub type updated: ${jewelrySubType.name} by admin: ${req.admin.email}`);

  res.json({
    success: true,
    message: 'Jewelry sub type updated successfully',
    data: jewelrySubType
  });
});

// Delete jewelry sub type
const deleteJewelrySubType = asyncHandler(async (req, res) => {
  const { JewelrySubType } = getModels();
  const { id } = req.params;

  const jewelrySubType = await JewelrySubType.findByPk(id);

  if (!jewelrySubType) {
    return res.status(404).json({
      success: false,
      message: 'Jewelry sub type not found'
    });
  }

  await jewelrySubType.destroy();
  logger.info(`Jewelry sub type deleted: ${jewelrySubType.name} by admin: ${req.admin.email}`);

  res.json({
    success: true,
    message: 'Jewelry sub type deleted successfully'
  });
});

// =====================================================
// EARRING TYPES
// =====================================================

// Get all earring types
const getEarringTypes = asyncHandler(async (req, res) => {
  const { EarringType } = getModels();

  const earringTypes = await EarringType.findAll({
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });

  res.json({
    success: true,
    data: earringTypes
  });
});

// Get earring type by ID
const getEarringTypeById = asyncHandler(async (req, res) => {
  const { EarringType } = getModels();
  const { id } = req.params;

  const earringType = await EarringType.findByPk(id);

  if (!earringType) {
    return res.status(404).json({
      success: false,
      message: 'Earring type not found'
    });
  }

  res.json({
    success: true,
    data: earringType
  });
});

// Create earring type
const createEarringType = asyncHandler(async (req, res) => {
  const { EarringType } = getModels();
  const { name, slug, description, is_active, sort_order } = req.body;

  const earringType = await EarringType.create({
    name,
    slug,
    description,
    is_active: is_active !== undefined ? is_active : true,
    sort_order: sort_order || 0
  });

  logger.info(`Earring type created: ${earringType.name} by admin: ${req.admin.email}`);

  res.status(201).json({
    success: true,
    message: 'Earring type created successfully',
    data: earringType
  });
});

// Update earring type
const updateEarringType = asyncHandler(async (req, res) => {
  const { EarringType } = getModels();
  const { id } = req.params;
  const { name, slug, description, is_active, sort_order } = req.body;

  const earringType = await EarringType.findByPk(id);

  if (!earringType) {
    return res.status(404).json({
      success: false,
      message: 'Earring type not found'
    });
  }

  await earringType.update({
    name: name !== undefined ? name : earringType.name,
    slug: slug !== undefined ? slug : earringType.slug,
    description: description !== undefined ? description : earringType.description,
    is_active: is_active !== undefined ? is_active : earringType.is_active,
    sort_order: sort_order !== undefined ? sort_order : earringType.sort_order
  });

  logger.info(`Earring type updated: ${earringType.name} by admin: ${req.admin.email}`);

  res.json({
    success: true,
    message: 'Earring type updated successfully',
    data: earringType
  });
});

// Delete earring type
const deleteEarringType = asyncHandler(async (req, res) => {
  const { EarringType } = getModels();
  const { id } = req.params;

  const earringType = await EarringType.findByPk(id);

  if (!earringType) {
    return res.status(404).json({
      success: false,
      message: 'Earring type not found'
    });
  }

  await earringType.destroy();
  logger.info(`Earring type deleted: ${earringType.name} by admin: ${req.admin.email}`);

  res.json({
    success: true,
    message: 'Earring type deleted successfully'
  });
});

// =====================================================
// NECKLACE TYPES
// =====================================================

// Get all necklace types
const getNecklaceTypes = asyncHandler(async (req, res) => {
  const { NecklaceType } = getModels();

  const necklaceTypes = await NecklaceType.findAll({
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });

  res.json({
    success: true,
    data: necklaceTypes
  });
});

// Get necklace type by ID
const getNecklaceTypeById = asyncHandler(async (req, res) => {
  const { NecklaceType } = getModels();
  const { id } = req.params;

  const necklaceType = await NecklaceType.findByPk(id);

  if (!necklaceType) {
    return res.status(404).json({
      success: false,
      message: 'Necklace type not found'
    });
  }

  res.json({
    success: true,
    data: necklaceType
  });
});

// Create necklace type
const createNecklaceType = asyncHandler(async (req, res) => {
  const { NecklaceType } = getModels();
  const { name, slug, description, is_active, sort_order } = req.body;

  const necklaceType = await NecklaceType.create({
    name,
    slug,
    description,
    is_active: is_active !== undefined ? is_active : true,
    sort_order: sort_order || 0
  });

  logger.info(`Necklace type created: ${necklaceType.name} by admin: ${req.admin.email}`);

  res.status(201).json({
    success: true,
    message: 'Necklace type created successfully',
    data: necklaceType
  });
});

// Update necklace type
const updateNecklaceType = asyncHandler(async (req, res) => {
  const { NecklaceType } = getModels();
  const { id } = req.params;
  const { name, slug, description, is_active, sort_order } = req.body;

  const necklaceType = await NecklaceType.findByPk(id);

  if (!necklaceType) {
    return res.status(404).json({
      success: false,
      message: 'Necklace type not found'
    });
  }

  await necklaceType.update({
    name: name !== undefined ? name : necklaceType.name,
    slug: slug !== undefined ? slug : necklaceType.slug,
    description: description !== undefined ? description : necklaceType.description,
    is_active: is_active !== undefined ? is_active : necklaceType.is_active,
    sort_order: sort_order !== undefined ? sort_order : necklaceType.sort_order
  });

  logger.info(`Necklace type updated: ${necklaceType.name} by admin: ${req.admin.email}`);

  res.json({
    success: true,
    message: 'Necklace type updated successfully',
    data: necklaceType
  });
});

// Delete necklace type
const deleteNecklaceType = asyncHandler(async (req, res) => {
  const { NecklaceType } = getModels();
  const { id } = req.params;

  const necklaceType = await NecklaceType.findByPk(id);

  if (!necklaceType) {
    return res.status(404).json({
      success: false,
      message: 'Necklace type not found'
    });
  }

  await necklaceType.destroy();
  logger.info(`Necklace type deleted: ${necklaceType.name} by admin: ${req.admin.email}`);

  res.json({
    success: true,
    message: 'Necklace type deleted successfully'
  });
});

// =====================================================
// BRACELET TYPES
// =====================================================

// Get all bracelet types
const getBraceletTypes = asyncHandler(async (req, res) => {
  const { BraceletType } = getModels();

  const braceletTypes = await BraceletType.findAll({
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });

  res.json({
    success: true,
    data: braceletTypes
  });
});

// Get bracelet type by ID
const getBraceletTypeById = asyncHandler(async (req, res) => {
  const { BraceletType } = getModels();
  const { id } = req.params;

  const braceletType = await BraceletType.findByPk(id);

  if (!braceletType) {
    return res.status(404).json({
      success: false,
      message: 'Bracelet type not found'
    });
  }

  res.json({
    success: true,
    data: braceletType
  });
});

// Create bracelet type
const createBraceletType = asyncHandler(async (req, res) => {
  const { BraceletType } = getModels();
  const { name, slug, description, is_active, sort_order } = req.body;

  const braceletType = await BraceletType.create({
    name,
    slug,
    description,
    is_active: is_active !== undefined ? is_active : true,
    sort_order: sort_order || 0
  });

  logger.info(`Bracelet type created: ${braceletType.name} by admin: ${req.admin.email}`);

  res.status(201).json({
    success: true,
    message: 'Bracelet type created successfully',
    data: braceletType
  });
});

// Update bracelet type
const updateBraceletType = asyncHandler(async (req, res) => {
  const { BraceletType } = getModels();
  const { id } = req.params;
  const { name, slug, description, is_active, sort_order } = req.body;

  const braceletType = await BraceletType.findByPk(id);

  if (!braceletType) {
    return res.status(404).json({
      success: false,
      message: 'Bracelet type not found'
    });
  }

  await braceletType.update({
    name: name !== undefined ? name : braceletType.name,
    slug: slug !== undefined ? slug : braceletType.slug,
    description: description !== undefined ? description : braceletType.description,
    is_active: is_active !== undefined ? is_active : braceletType.is_active,
    sort_order: sort_order !== undefined ? sort_order : braceletType.sort_order
  });

  logger.info(`Bracelet type updated: ${braceletType.name} by admin: ${req.admin.email}`);

  res.json({
    success: true,
    message: 'Bracelet type updated successfully',
    data: braceletType
  });
});

// Delete bracelet type
const deleteBraceletType = asyncHandler(async (req, res) => {
  const { BraceletType } = getModels();
  const { id } = req.params;

  const braceletType = await BraceletType.findByPk(id);

  if (!braceletType) {
    return res.status(404).json({
      success: false,
      message: 'Bracelet type not found'
    });
  }

  await braceletType.destroy();
  logger.info(`Bracelet type deleted: ${braceletType.name} by admin: ${req.admin.email}`);

  res.json({
    success: true,
    message: 'Bracelet type deleted successfully'
  });
});

module.exports = {
  // Jewelry Types
  getJewelryTypes,
  getJewelryTypeById,
  createJewelryType,
  updateJewelryType,
  deleteJewelryType,

  // Jewelry Sub Types
  getJewelrySubTypes,
  getJewelrySubTypeById,
  createJewelrySubType,
  updateJewelrySubType,
  deleteJewelrySubType,

  // Earring Types
  getEarringTypes,
  getEarringTypeById,
  createEarringType,
  updateEarringType,
  deleteEarringType,

  // Necklace Types
  getNecklaceTypes,
  getNecklaceTypeById,
  createNecklaceType,
  updateNecklaceType,
  deleteNecklaceType,

  // Bracelet Types
  getBraceletTypes,
  getBraceletTypeById,
  createBraceletType,
  updateBraceletType,
  deleteBraceletType
};

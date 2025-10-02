const Joi = require('joi');
const { commonSchemas } = require('../middleware/validation');

const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  slug: Joi.string().pattern(new RegExp('^[a-z0-9]+(?:-[a-z0-9]+)*$')).max(255).required(),
  description: Joi.string().allow(''),
  short_description: Joi.string().max(500).allow(''),
  sku: Joi.string().max(100),
  base_price: Joi.number().precision(2).min(0).required(),
  sale_price: Joi.number().precision(2).min(0).optional(),
  currency: Joi.string().length(3).default('GBP'),
  is_active: Joi.boolean().default(true),
  is_featured: Joi.boolean().default(false),
  in_stock: Joi.boolean().default(true),
  stock_quantity: Joi.number().integer().min(0).default(0),
  weight: Joi.number().precision(3).min(0).optional(),
  dimensions: Joi.object().optional(),
  care_instructions: Joi.string().allow(''),
  warranty_info: Joi.string().allow(''),
  meta_title: Joi.string().max(200).allow(''),
  meta_description: Joi.string().allow(''),
  sort_order: Joi.number().integer().default(0),
  category_id: commonSchemas.uuid.required(),
  collection_id: commonSchemas.uuid.optional(),
  images: Joi.array().items(
    Joi.object({
      image_url: Joi.string().uri().required(),
      alt_text: Joi.string().max(255).allow(''),
      is_primary: Joi.boolean().default(false),
      sort_order: Joi.number().integer().default(0)
    })
  ).min(1).required(),
  variants: Joi.array().items(
    Joi.object({
      variant_name: Joi.string().max(100).required(),
      sku: Joi.string().max(100).optional(),
      price_adjustment: Joi.number().precision(2).default(0),
      metal_type: Joi.string().max(50).optional(),
      metal_color: Joi.string().pattern(new RegExp('^#[0-9A-Fa-f]{6}$')).optional(),
      size: Joi.string().max(20).optional(),
      gemstone_type: Joi.string().max(50).optional(),
      gemstone_carat: Joi.number().precision(2).min(0).optional(),
      stock_quantity: Joi.number().integer().min(0).default(0),
      is_active: Joi.boolean().default(true)
    })
  ).optional()
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  slug: Joi.string().pattern(new RegExp('^[a-z0-9]+(?:-[a-z0-9]+)*$')).max(255),
  description: Joi.string().allow(''),
  short_description: Joi.string().max(500).allow(''),
  sku: Joi.string().max(100),
  base_price: Joi.number().precision(2).min(0),
  sale_price: Joi.number().precision(2).min(0),
  currency: Joi.string().length(3),
  is_active: Joi.boolean(),
  is_featured: Joi.boolean(),
  in_stock: Joi.boolean(),
  stock_quantity: Joi.number().integer().min(0),
  weight: Joi.number().precision(3).min(0),
  dimensions: Joi.object(),
  care_instructions: Joi.string().allow(''),
  warranty_info: Joi.string().allow(''),
  meta_title: Joi.string().max(200).allow(''),
  meta_description: Joi.string().allow(''),
  sort_order: Joi.number().integer(),
  category_id: commonSchemas.uuid,
  collection_id: commonSchemas.uuid.allow(null)
}).min(1);

const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  slug: Joi.string().pattern(new RegExp('^[a-z0-9]+(?:-[a-z0-9]+)*$')).max(100).required(),
  description: Joi.string().allow(''),
  image_url: Joi.string().uri().allow(''),
  is_active: Joi.boolean().default(true),
  sort_order: Joi.number().integer().default(0),
  meta_title: Joi.string().max(200).allow(''),
  meta_description: Joi.string().allow('')
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100),
  slug: Joi.string().pattern(new RegExp('^[a-z0-9]+(?:-[a-z0-9]+)*$')).max(100),
  description: Joi.string().allow(''),
  image_url: Joi.string().uri().allow(''),
  is_active: Joi.boolean(),
  sort_order: Joi.number().integer(),
  meta_title: Joi.string().max(200).allow(''),
  meta_description: Joi.string().allow('')
}).min(1);

const productQuerySchema = Joi.object({
  category: Joi.string().optional(),
  collection: Joi.string().optional(),
  price_min: Joi.number().min(0).optional(),
  price_max: Joi.number().min(0).optional(),
  metal: Joi.string().optional(),
  gemstone: Joi.string().optional(),
  featured: Joi.boolean().optional(),
  in_stock: Joi.boolean().optional(),
  sort: Joi.string().valid('name', 'price', 'created_at', 'featured', 'sort_order').optional(),
  order: Joi.string().valid('asc', 'desc').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  productQuerySchema
};
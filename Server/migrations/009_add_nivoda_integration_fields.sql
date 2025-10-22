-- Migration: Add Nivoda Integration Fields to Products
-- Created: 2025-10-19
-- Description: Add fields to support Nivoda diamond API integration for dynamic pricing and specifications

-- Add Nivoda integration fields to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS nivoda_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_stone_type BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_carat BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_clarity BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_colour BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_cut BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_certificate BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS certificate VARCHAR(255);

-- Add index for Nivoda-enabled products for faster queries
CREATE INDEX IF NOT EXISTS idx_products_nivoda_enabled ON products(nivoda_enabled) WHERE nivoda_enabled = TRUE;

-- Comments for documentation
COMMENT ON COLUMN products.nivoda_enabled IS 'Whether this product uses Nivoda API for dynamic diamond specifications and pricing';
COMMENT ON COLUMN products.show_stone_type IS 'Display stone type selector (Natural/Lab-Grown) on product detail page';
COMMENT ON COLUMN products.show_carat IS 'Display carat weight options on product detail page';
COMMENT ON COLUMN products.show_clarity IS 'Display clarity options on product detail page';
COMMENT ON COLUMN products.show_colour IS 'Display colour options on product detail page';
COMMENT ON COLUMN products.show_cut IS 'Display cut quality options on product detail page';
COMMENT ON COLUMN products.show_certificate IS 'Display certificate information on product detail page';
COMMENT ON COLUMN products.certificate IS 'Certificate authority or number (e.g., GIA, IGI, certificate number)';

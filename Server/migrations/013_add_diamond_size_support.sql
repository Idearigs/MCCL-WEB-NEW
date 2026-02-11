-- Migration: 013_add_diamond_size_support.sql
-- Description: Add Diamond Size support for Engagement Rings
-- Date: 2026-02-06

-- Create diamond_sizes lookup table
CREATE TABLE IF NOT EXISTS diamond_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,  -- 'A', 'B', 'C', etc.
  display_name VARCHAR(100),          -- 'Diamond Size A', etc.
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default diamond sizes (A-F)
INSERT INTO diamond_sizes (name, display_name, sort_order) VALUES
  ('A', 'Diamond Size A', 1),
  ('B', 'Diamond Size B', 2),
  ('C', 'Diamond Size C', 3),
  ('D', 'Diamond Size D', 4),
  ('E', 'Diamond Size E', 5),
  ('F', 'Diamond Size F', 6)
ON CONFLICT (name) DO NOTHING;

-- Create product-diamond size junction table (many-to-many)
CREATE TABLE IF NOT EXISTS product_diamond_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  diamond_size_id UUID NOT NULL REFERENCES diamond_sizes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, diamond_size_id)
);

-- Add diamond_size_id to product_images
ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS diamond_size_id UUID REFERENCES diamond_sizes(id);

-- Add is_diamond_size_preview flag
ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS is_diamond_size_preview BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_images_diamond_size_id ON product_images(diamond_size_id);
CREATE INDEX IF NOT EXISTS idx_product_diamond_sizes_product_id ON product_diamond_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_diamond_sizes_diamond_size_id ON product_diamond_sizes(diamond_size_id);
CREATE INDEX IF NOT EXISTS idx_diamond_sizes_name ON diamond_sizes(name);
CREATE INDEX IF NOT EXISTS idx_diamond_sizes_is_active ON diamond_sizes(is_active);

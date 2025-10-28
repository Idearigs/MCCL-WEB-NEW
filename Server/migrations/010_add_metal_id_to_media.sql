-- Migration: Add metal_id column for metal-specific media
-- Created: 2025-10-28
-- Description: Add metal_id foreign key columns to product_images and product_videos tables
-- to support metal-specific image and video uploads

-- Add metal_id column to product_images table if it doesn't exist
ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS metal_id UUID;

-- Add index on metal_id for faster queries
CREATE INDEX IF NOT EXISTS idx_product_images_metal_id ON product_images(metal_id);

-- Add metal_id column to product_videos table if it doesn't exist
ALTER TABLE product_videos
  ADD COLUMN IF NOT EXISTS metal_id UUID;

-- Add index on metal_id for faster queries
CREATE INDEX IF NOT EXISTS idx_product_videos_metal_id ON product_videos(metal_id);

-- Comments for documentation
COMMENT ON COLUMN product_images.metal_id IS 'Optional: Link this image to a specific metal/material variation. NULL means image applies to all metals.';
COMMENT ON COLUMN product_videos.metal_id IS 'Optional: Link this video to a specific metal/material variation. NULL means video applies to all metals.';

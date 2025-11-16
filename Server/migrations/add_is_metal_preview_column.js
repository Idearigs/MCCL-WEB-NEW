/**
 * Migration: Add is_metal_preview column to product_images table
 * This column marks which image should be shown in the metal selection section
 * Run: node migrations/add_is_metal_preview_column.js
 */

require('dotenv').config();
const pool = require('../config/pool');

async function addMetalPreviewColumn() {
  try {
    console.log('Starting migration: Add is_metal_preview column to product_images...\n');

    // Add the column if it doesn't exist
    await pool.query(`
      ALTER TABLE product_images
      ADD COLUMN IF NOT EXISTS is_metal_preview BOOLEAN DEFAULT false;
    `);

    console.log('✓ Column is_metal_preview added successfully');

    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_product_images_is_metal_preview
      ON product_images(is_metal_preview);
    `);

    console.log('✓ Index created for is_metal_preview column');

    // Add comment to explain the column
    await pool.query(`
      COMMENT ON COLUMN product_images.is_metal_preview IS
      'Flag to mark this image as the preview for metal selection in product detail page';
    `);

    console.log('✓ Column comment added');

    console.log('\n✓ Migration completed successfully!');
    console.log('The is_metal_preview field is now available for use.\n');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addMetalPreviewColumn();

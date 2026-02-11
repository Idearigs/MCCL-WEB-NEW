/**
 * Diamond Size Images Import Script
 *
 * Purpose: Import images from folder structure to database for Engagement Rings with Diamond Size variants
 *
 * Image Naming Convention:
 * Client/public/images/Engagement-rings/BJ-XXX/BJ-XXX(A)/BJ-XXX(A)-1-R.jpg
 * ├── BJ-XXX = Product SKU
 * ├── (A) = Diamond Size (A-Z, but A-F for now)
 * ├── 1 = Angle/Image number
 * └── R/W/Y = Metal (Rose/White/Yellow Gold)
 *
 * Metal Mapping:
 * R = Rose Gold (18K Rose Gold)
 * W = White Gold (18K White Gold)
 * Y = Yellow Gold (18K Yellow Gold)
 *
 * Usage: node scripts/import-diamond-size-images.js [--dry-run]
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const SOURCE_FOLDER = path.join(__dirname, '..', '..', 'Client', 'images', 'Engagement-rings');
const UPLOADS_FOLDER = path.join(__dirname, '..', 'uploads', 'products');
const DRY_RUN = process.argv.includes('--dry-run');

// Metal name mapping (suffix -> database name)
const METAL_MAPPING = {
  'R': 'Rose Gold',
  'W': 'White Gold',
  'Y': 'Yellow Gold'
};

// Database connection
const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
});

/**
 * Get all diamond sizes from database
 */
async function getDiamondSizes() {
  const result = await pool.query(
    `SELECT id, name FROM diamond_sizes WHERE is_active = true ORDER BY sort_order`
  );
  const sizes = {};
  result.rows.forEach(row => {
    sizes[row.name] = row.id;
  });
  return sizes;
}

/**
 * Get all metals from database
 */
async function getMetals() {
  const result = await pool.query(
    `SELECT id, name FROM product_metals WHERE is_active = true`
  );
  const metals = {};
  result.rows.forEach(row => {
    metals[row.name] = row.id;
  });
  return metals;
}

/**
 * Get product by SKU
 */
async function getProductBySku(sku) {
  const result = await pool.query(
    `SELECT id, name, sku FROM products WHERE sku = $1`,
    [sku]
  );
  return result.rows[0] || null;
}

/**
 * Link product to diamond size (if not already linked)
 */
async function linkProductToDiamondSize(productId, diamondSizeId) {
  try {
    await pool.query(`
      INSERT INTO product_diamond_sizes (product_id, diamond_size_id)
      VALUES ($1, $2)
      ON CONFLICT (product_id, diamond_size_id) DO NOTHING
    `, [productId, diamondSizeId]);
    return true;
  } catch (error) {
    console.warn(`  Warning: Could not link product to diamond size: ${error.message}`);
    return false;
  }
}

/**
 * Create product image record
 */
async function createProductImage(productId, imageUrl, metalId, diamondSizeId, sortOrder, isPreview) {
  try {
    const result = await pool.query(`
      INSERT INTO product_images (
        id,
        product_id,
        image_url,
        alt_text,
        metal_id,
        diamond_size_id,
        sort_order,
        is_primary,
        is_metal_preview,
        is_diamond_size_preview,
        created_at,
        updated_at
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      productId,
      imageUrl,
      `Product image`,
      metalId,
      diamondSizeId,
      sortOrder,
      false, // is_primary
      sortOrder === 1, // is_metal_preview - first image is the metal preview
      isPreview, // is_diamond_size_preview
    ]);
    return result.rows[0].id;
  } catch (error) {
    console.error(`  Error creating image record: ${error.message}`);
    return null;
  }
}

/**
 * Parse image filename to extract metadata
 * Handles multiple naming conventions:
 *   BJ-101(A)-1-R.jpg     (standard with diamond size)
 *   BJ-102-1-R.png         (no diamond size in filename)
 *   BJ - 032-1-R.png       (spaces around dash)
 *   BJ-025 (F)-1-R.png     (space before parenthesis)
 * Returns: { imageNumber, metal, extension } (diamond size comes from folder)
 */
function parseImageFilename(filename) {
  // Extract the image number, metal suffix, and extension from the end of the filename
  // Pattern: ...-NUMBER-METAL.ext
  const match = filename.match(/-(\d+)-([RWY])\.(jpg|jpeg|png|webp)$/i);

  if (!match) {
    return null;
  }

  return {
    imageNumber: parseInt(match[1], 10),
    metal: match[2].toUpperCase(),
    extension: match[3].toLowerCase()
  };
}

/**
 * Parse folder name to extract diamond size
 * Handles multiple naming conventions:
 *   BJ-101(A)       (standard)
 *   BJ - 025(A)     (spaces around dash)
 *   BJ-025 (F)      (space before parenthesis)
 *   BJ - 032        (no diamond size - base folder)
 * Returns: { diamondSize } or null if no diamond size letter found
 */
function parseFolderName(folderName) {
  // Look for a single letter in parentheses anywhere in the folder name
  const match = folderName.match(/\(([A-Z])\)/i);

  if (!match) {
    return null;
  }

  return {
    diamondSize: match[1].toUpperCase()
  };
}

/**
 * Copy file from source to destination
 */
function copyFile(source, destination) {
  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would copy: ${source} -> ${destination}`);
    return true;
  }

  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(source, destination);
    return true;
  } catch (error) {
    console.error(`  Error copying file: ${error.message}`);
    return false;
  }
}

/**
 * Main import function
 */
async function importDiamondSizeImages() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('    DIAMOND SIZE IMAGES IMPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Verify source folder exists
  if (!fs.existsSync(SOURCE_FOLDER)) {
    console.error(`❌ Source folder not found: ${SOURCE_FOLDER}`);
    console.log('\nPlease ensure the engagement ring images are in:');
    console.log(`  ${SOURCE_FOLDER}`);
    process.exit(1);
  }

  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✓ Connected to database\n');

    // Get lookup data
    const diamondSizes = await getDiamondSizes();
    const metals = await getMetals();

    console.log('📊 Diamond Sizes in database:');
    Object.keys(diamondSizes).forEach(name => console.log(`   • ${name}`));

    console.log('\n📊 Metals in database:');
    Object.keys(metals).forEach(name => console.log(`   • ${name}`));

    // Stats
    let stats = {
      productsFound: 0,
      productsNotFound: [],
      diamondSizesLinked: 0,
      imagesImported: 0,
      imagesFailed: 0,
      foldersProcessed: 0
    };

    // Scan product folders (BJ-101, BJ-102, etc.)
    const productFolders = fs.readdirSync(SOURCE_FOLDER)
      .filter(f => fs.statSync(path.join(SOURCE_FOLDER, f)).isDirectory());

    console.log(`\n📁 Found ${productFolders.length} product folders\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const productFolder of productFolders) {
      const productFolderPath = path.join(SOURCE_FOLDER, productFolder);
      const productSku = productFolder.toUpperCase();

      console.log(`\n📦 Processing Product: ${productSku}`);
      console.log('─'.repeat(50));

      // Find product in database
      const product = await getProductBySku(productSku);

      if (!product) {
        console.log(`   ⚠️  Product not found in database: ${productSku}`);
        stats.productsNotFound.push(productSku);
        continue;
      }

      console.log(`   ✓ Found product: ${product.name} (ID: ${product.id})`);
      stats.productsFound++;

      // Scan diamond size subfolders (BJ-101(A), BJ-101(B), etc.)
      const diamondSizeFolders = fs.readdirSync(productFolderPath)
        .filter(f => fs.statSync(path.join(productFolderPath, f)).isDirectory());

      for (const diamondSizeFolder of diamondSizeFolders) {
        const folderInfo = parseFolderName(diamondSizeFolder);

        if (!folderInfo) {
          console.log(`   ⚠️  Skipping invalid folder: ${diamondSizeFolder}`);
          continue;
        }

        const diamondSizeId = diamondSizes[folderInfo.diamondSize];

        if (!diamondSizeId) {
          console.log(`   ⚠️  Diamond size not in database: ${folderInfo.diamondSize}`);
          continue;
        }

        console.log(`\n   💎 Diamond Size: ${folderInfo.diamondSize}`);

        // Link product to diamond size
        if (!DRY_RUN) {
          const linked = await linkProductToDiamondSize(product.id, diamondSizeId);
          if (linked) {
            stats.diamondSizesLinked++;
          }
        } else {
          console.log(`      [DRY-RUN] Would link product to diamond size ${folderInfo.diamondSize}`);
          stats.diamondSizesLinked++;
        }

        stats.foldersProcessed++;

        // Scan images in this folder
        const diamondSizeFolderPath = path.join(productFolderPath, diamondSizeFolder);
        const imageFiles = fs.readdirSync(diamondSizeFolderPath)
          .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

        let firstImagePerMetal = {};

        for (const imageFile of imageFiles) {
          const imageInfo = parseImageFilename(imageFile);

          if (!imageInfo) {
            console.log(`      ⚠️  Skipping invalid filename: ${imageFile}`);
            continue;
          }

          const metalName = METAL_MAPPING[imageInfo.metal];
          const metalId = metals[metalName];

          if (!metalId) {
            console.log(`      ⚠️  Metal not found: ${metalName} (${imageInfo.metal})`);
            continue;
          }

          // Track if this is the first image for this metal (for preview flag)
          const metalKey = `${imageInfo.metal}-${folderInfo.diamondSize}`;
          const isFirstForMetal = !firstImagePerMetal[metalKey];
          if (isFirstForMetal) {
            firstImagePerMetal[metalKey] = true;
          }

          // Normalize filename to use correct product SKU: BJ-102(A)-1-R.png
          const normalizedFilename = `${productSku}(${folderInfo.diamondSize})-${imageInfo.imageNumber}-${imageInfo.metal}.${imageInfo.extension}`;

          // Determine destination path using normalized naming
          const destFolder = path.join(UPLOADS_FOLDER, productSku, `${productSku}(${folderInfo.diamondSize})`);
          const destPath = path.join(destFolder, normalizedFilename);
          const imageUrl = `/uploads/products/${productSku}/${productSku}(${folderInfo.diamondSize})/${normalizedFilename}`;

          // Copy file
          const sourcePath = path.join(diamondSizeFolderPath, imageFile);
          const copied = copyFile(sourcePath, destPath);

          if (!copied && !DRY_RUN) {
            stats.imagesFailed++;
            continue;
          }

          // Create database record
          if (!DRY_RUN) {
            const imageId = await createProductImage(
              product.id,
              imageUrl,
              metalId,
              diamondSizeId,
              imageInfo.imageNumber,
              isFirstForMetal // is_diamond_size_preview for first image of each metal
            );

            if (imageId) {
              stats.imagesImported++;
              console.log(`      ✓ Imported: ${imageFile} (Metal: ${metalName})`);
            } else {
              stats.imagesFailed++;
            }
          } else {
            console.log(`      [DRY-RUN] Would import: ${imageFile} (Metal: ${metalName})`);
            stats.imagesImported++;
          }
        }
      }
    }

    // Print summary
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('    IMPORT COMPLETE - SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    if (DRY_RUN) {
      console.log('🔍 DRY RUN - No actual changes were made\n');
    }

    console.log(`📦 Products found in database: ${stats.productsFound}`);
    console.log(`💎 Diamond size links created: ${stats.diamondSizesLinked}`);
    console.log(`📁 Folders processed: ${stats.foldersProcessed}`);
    console.log(`🖼️  Images imported: ${stats.imagesImported}`);
    console.log(`❌ Images failed: ${stats.imagesFailed}`);

    if (stats.productsNotFound.length > 0) {
      console.log(`\n⚠️  Products not found in database (${stats.productsNotFound.length}):`);
      stats.productsNotFound.forEach(sku => console.log(`   • ${sku}`));
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    if (DRY_RUN) {
      console.log('To perform the actual import, run without --dry-run flag:\n');
      console.log('  node scripts/import-diamond-size-images.js\n');
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the import
importDiamondSizeImages();

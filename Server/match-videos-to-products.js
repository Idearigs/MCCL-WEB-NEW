const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const sequelize = new Sequelize({
  host: '31.97.116.89',
  port: 5432,
  database: 'mcculloch_db',
  username: 'mcculloch_admin',
  password: '#mcculloch_admin#20026',
  dialect: 'postgres',
  logging: false
});

const VIDEOS_FOLDER = path.join(__dirname, '..', 'Edited Videos');

// Function to extract SKU from video filename
function extractSKUFromFilename(filename) {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.(mp4|MP4|mov|MOV)$/i, '');

  // Normalize the name - remove spaces, hyphens at start
  let sku = nameWithoutExt.trim();

  // Handle different formats:
  // "BJ -001" -> "BJ-001"
  // "BJ 001" -> "BJ001"
  // "118cbj" -> "118CBJ"

  sku = sku.replace(/\s+/g, '').toUpperCase();

  // Return possible SKU variations
  const variations = [
    sku,                                    // "BJ001"
    sku.replace('-', ''),                   // Remove hyphen
    sku.replace(/^BJ/, 'BJ-'),             // "BJ-001"
    sku.replace(/^BJ/, 'BJ '),             // "BJ 001"
    nameWithoutExt.trim().toUpperCase(),    // Original with spaces
  ];

  return [...new Set(variations)]; // Remove duplicates
}

async function matchVideosToProducts() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Read all video files
    const videoFiles = fs.readdirSync(VIDEOS_FOLDER)
      .filter(file => /\.(mp4|MP4|mov|MOV)$/i.test(file));

    console.log(`Found ${videoFiles.length} video files in: ${VIDEOS_FOLDER}\n`);

    // Get all products from database
    const [products] = await sequelize.query(`
      SELECT id, name, sku
      FROM products
      WHERE sku IS NOT NULL
      ORDER BY sku
    `);

    console.log(`Found ${products.length} products in database\n`);

    // Create SKU lookup map
    const productBySKU = new Map();
    products.forEach(product => {
      if (product.sku) {
        productBySKU.set(product.sku.toUpperCase(), product);
      }
    });

    console.log('═══════════════════════════════════════════');
    console.log('VIDEO-TO-PRODUCT MATCHING ANALYSIS');
    console.log('═══════════════════════════════════════════\n');

    const matched = [];
    const unmatched = [];

    videoFiles.forEach(filename => {
      const skuVariations = extractSKUFromFilename(filename);
      let matchedProduct = null;

      // Try all SKU variations
      for (const variation of skuVariations) {
        if (productBySKU.has(variation)) {
          matchedProduct = productBySKU.get(variation);
          break;
        }
      }

      if (matchedProduct) {
        matched.push({
          filename,
          product: matchedProduct,
          matchedSKU: matchedProduct.sku
        });
      } else {
        unmatched.push({
          filename,
          triedSKUs: skuVariations
        });
      }
    });

    // Print matched videos
    console.log(`✅ MATCHED VIDEOS (${matched.length}):\n`);
    matched.forEach(({ filename, product, matchedSKU }) => {
      console.log(`  ✓ ${filename}`);
      console.log(`    → Product: ${product.name}`);
      console.log(`    → SKU: ${matchedSKU}`);
      console.log(`    → Product ID: ${product.id}`);
      console.log('');
    });

    // Print unmatched videos
    if (unmatched.length > 0) {
      console.log(`\n❌ UNMATCHED VIDEOS (${unmatched.length}):\n`);
      unmatched.forEach(({ filename, triedSKUs }) => {
        console.log(`  ✗ ${filename}`);
        console.log(`    Tried SKUs: ${triedSKUs.join(', ')}`);
        console.log('');
      });
    }

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Total videos: ${videoFiles.length}`);
    console.log(`Matched: ${matched.length} (${((matched.length / videoFiles.length) * 100).toFixed(1)}%)`);
    console.log(`Unmatched: ${unmatched.length} (${((unmatched.length / videoFiles.length) * 100).toFixed(1)}%)`);
    console.log('');

    // Save matched list for upload script
    const matchReport = {
      timestamp: new Date().toISOString(),
      videosFolder: VIDEOS_FOLDER,
      totalVideos: videoFiles.length,
      matched: matched.map(m => ({
        filename: m.filename,
        productId: m.product.id,
        productName: m.product.name,
        sku: m.matchedSKU,
        localPath: path.join(VIDEOS_FOLDER, m.filename)
      })),
      unmatched: unmatched.map(u => ({
        filename: u.filename,
        triedSKUs: u.triedSKUs
      }))
    };

    fs.writeFileSync(
      path.join(__dirname, 'video-match-report.json'),
      JSON.stringify(matchReport, null, 2)
    );

    console.log('✓ Match report saved to: video-match-report.json\n');

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

matchVideosToProducts();

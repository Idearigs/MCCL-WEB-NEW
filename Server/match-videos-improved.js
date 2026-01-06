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

const VIDEO_DIR = 'C:\\xampp\\htdocs\\testmccl\\McCulloch Website\\McCulloch Website\\Edited Videos';

function generateSKUVariations(videoFileName) {
  const nameWithoutExt = videoFileName.replace(/\.(mp4|MP4|mov|MOV)$/i, '');
  const upper = nameWithoutExt.toUpperCase().trim();

  const variations = new Set();

  // Add original
  variations.add(upper);

  // Extract BJ number pattern: BJ-NNN or BJ NNN or BJNNN
  const bjMatch = upper.match(/BJ\s*-?\s*(\d+)\s*([A-Z])?/i);

  if (bjMatch) {
    const number = bjMatch[1]; // The numeric part
    const letter = bjMatch[2] || ''; // Optional letter part

    // Remove leading zeros from number
    const numWithoutLeadingZero = number.replace(/^0+/, '');

    // Generate all format combinations
    const formats = [
      `BJ-${number}`,           // BJ-050
      `BJ-${numWithoutLeadingZero}`, // BJ-50
      `BJ ${number}`,           // BJ 050
      `BJ ${numWithoutLeadingZero}`, // BJ 50
      `BJ${number}`,            // BJ050
      `BJ${numWithoutLeadingZero}`, // BJ50
    ];

    if (letter) {
      // With letter variants (for variant codes like BJ 101 C)
      formats.forEach(format => {
        variations.add(`${format}${letter}`);           // BJ-101C
        variations.add(`${format} ${letter}`);          // BJ-101 C
        variations.add(`${format}(${letter})`);         // BJ-101(C)
        variations.add(`${format} (${letter})`);        // BJ-101 (C)
        variations.add(`${format}-(${letter})`);        // BJ-102-(A)
      });
    } else {
      // Without letter
      formats.forEach(format => variations.add(format));
    }
  }

  // Also try removing all special characters
  variations.add(upper.replace(/[^A-Z0-9]/g, ''));

  // Try removing spaces
  variations.add(upper.replace(/\s+/g, ''));

  // Try spaces to hyphens
  variations.add(upper.replace(/\s+/g, '-'));

  // Try hyphens to spaces
  variations.add(upper.replace(/-/g, ' '));

  return Array.from(variations);
}

async function matchVideosImproved() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Get all products with BJ-prefixed SKUs
    const [products] = await sequelize.query(`
      SELECT id, name, sku
      FROM products
      WHERE sku LIKE 'BJ%'
      ORDER BY sku
    `);

    console.log('═══════════════════════════════════════════');
    console.log('IMPROVED VIDEO MATCHING');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Total BJ products in database: ${products.length}\n`);

    // Create comprehensive SKU lookup map
    const skuMap = new Map();
    products.forEach(product => {
      const sku = product.sku.toUpperCase();

      // Store original SKU
      if (!skuMap.has(sku)) {
        skuMap.set(sku, product);
      }

      // Generate variations for database SKU
      const dbVariations = generateSKUVariations(sku);
      dbVariations.forEach(variation => {
        if (!skuMap.has(variation)) {
          skuMap.set(variation, product);
        }
      });
    });

    console.log(`Created lookup map with ${skuMap.size} SKU variations\n`);

    // Get all video files
    const videoFiles = fs.readdirSync(VIDEO_DIR)
      .filter(file => /\.(mp4|MP4|mov|MOV)$/i.test(file));

    // Separate BJ and non-BJ videos
    const bjVideos = [];
    const nonBjVideos = [];

    videoFiles.forEach(file => {
      const nameWithoutExt = file.replace(/\.(mp4|MP4|mov|MOV)$/i, '');
      const upperName = nameWithoutExt.toUpperCase();

      if (upperName === 'P12' || upperName === 'P13' || upperName === 'PN0931') {
        nonBjVideos.push(file);
      } else if (upperName.includes('BJ') || /^\d+.*BJ/i.test(upperName)) {
        bjVideos.push(file);
      } else {
        nonBjVideos.push(file);
      }
    });

    console.log(`Total videos: ${videoFiles.length}`);
    console.log(`  - BJ videos: ${bjVideos.length}`);
    console.log(`  - Non-BJ videos (P12, P13, PN0931, etc.): ${nonBjVideos.length}\n`);

    const matched = [];
    const unmatched = [];
    const manualReview = [];

    bjVideos.forEach(filename => {
      const variations = generateSKUVariations(filename);
      let foundMatch = false;

      for (const variation of variations) {
        if (skuMap.has(variation)) {
          const product = skuMap.get(variation);
          matched.push({
            filename,
            matchedVariation: variation,
            productSKU: product.sku,
            productName: product.name,
            productId: product.id,
            localPath: path.join(VIDEO_DIR, filename)
          });
          foundMatch = true;
          break;
        }
      }

      if (!foundMatch) {
        // Check if it's a special case that needs manual review
        const upper = filename.toUpperCase();
        if (upper.includes('118') || upper.includes('119') || upper.includes('120')) {
          manualReview.push({
            filename,
            reason: 'Non-standard SKU format with number prefix',
            triedVariations: variations.slice(0, 5)
          });
        } else {
          unmatched.push({
            filename,
            triedVariations: variations.slice(0, 5)
          });
        }
      }
    });

    console.log('═══════════════════════════════════════════');
    console.log('MATCHING RESULTS');
    console.log('═══════════════════════════════════════════\n');
    console.log(`✅ Matched: ${matched.length} / ${bjVideos.length} (${((matched.length / bjVideos.length) * 100).toFixed(1)}%)`);
    console.log(`❌ Unmatched: ${unmatched.length}`);
    console.log(`⚠️  Manual review needed: ${manualReview.length}`);
    console.log(`ℹ️  Non-BJ videos (excluded): ${nonBjVideos.length}\n`);

    // Show unmatched videos
    if (unmatched.length > 0) {
      console.log('═══════════════════════════════════════════');
      console.log('UNMATCHED VIDEOS');
      console.log('═══════════════════════════════════════════\n');
      unmatched.forEach(item => {
        console.log(`❌ ${item.filename}`);
        console.log(`   Tried: ${item.triedVariations.join(', ')}`);
      });
      console.log('');
    }

    // Show manual review cases
    if (manualReview.length > 0) {
      console.log('═══════════════════════════════════════════');
      console.log('MANUAL REVIEW NEEDED');
      console.log('═══════════════════════════════════════════\n');
      manualReview.forEach(item => {
        console.log(`⚠️  ${item.filename}`);
        console.log(`   Reason: ${item.reason}`);
        console.log(`   Tried: ${item.triedVariations.join(', ')}`);
      });
      console.log('');
    }

    // Show non-BJ videos
    if (nonBjVideos.length > 0) {
      console.log('═══════════════════════════════════════════');
      console.log('NON-BJ VIDEOS (EXCLUDED FROM MATCHING)');
      console.log('═══════════════════════════════════════════\n');
      nonBjVideos.forEach(file => {
        console.log(`ℹ️  ${file}`);
      });
      console.log('');
    }

    // Save comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalVideos: videoFiles.length,
        bjVideos: bjVideos.length,
        nonBjVideos: nonBjVideos.length,
        matched: matched.length,
        unmatched: unmatched.length,
        manualReview: manualReview.length,
        matchRate: `${((matched.length / bjVideos.length) * 100).toFixed(1)}%`,
        overallRate: `${((matched.length / videoFiles.length) * 100).toFixed(1)}%`
      },
      matched,
      unmatched,
      manualReview,
      nonBjVideos: nonBjVideos.map(f => ({
        filename: f,
        reason: 'Not a BJ-prefixed product'
      }))
    };

    fs.writeFileSync(
      path.join(__dirname, 'video-match-report-improved.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('═══════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Total BJ videos ready for upload: ${matched.length}`);
    console.log(`Videos needing investigation: ${unmatched.length + manualReview.length}`);
    console.log('');
    console.log('✓ Report saved to: video-match-report-improved.json\n');

    // Sample matches
    console.log('Sample matched videos (first 10):');
    matched.slice(0, 10).forEach(item => {
      console.log(`  ✓ ${item.filename} → ${item.productSKU} (${item.productName})`);
    });
    console.log('');

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

matchVideosImproved();

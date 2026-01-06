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

function extractSkuFromFilename(filename) {
  const nameWithoutExt = filename.replace(/\.(mp4|MP4|mov|MOV)$/i, '');
  let cleaned = nameWithoutExt.trim().toUpperCase();

  // Remove all spaces and hyphens initially
  cleaned = cleaned.replace(/\s+/g, '').replace(/-/g, '');

  const variations = [];

  // Pattern: BJ followed by numbers, optionally followed by a letter
  const match = cleaned.match(/^BJ0*(\d+)([A-Z]?).*$/);

  if (match) {
    let baseNumber = match[1];
    const variantLetter = match[2] || null;

    // Generate variations with leading zeros preserved
    const numValue = parseInt(baseNumber, 10);
    const paddedNumber = numValue.toString().padStart(3, '0'); // 001, 054, etc.
    const unpaddedNumber = numValue.toString(); // 1, 54, etc.

    if (variantLetter) {
      // With variant letter - use parentheses format
      variations.push(`BJ-${paddedNumber}(${variantLetter})`);
      variations.push(`BJ-${unpaddedNumber}(${variantLetter})`);
      variations.push(`BJ-${paddedNumber} (${variantLetter})`);
      variations.push(`BJ-${unpaddedNumber} (${variantLetter})`);
      variations.push(`BJ-${paddedNumber}${variantLetter}`);
      variations.push(`BJ-${unpaddedNumber}${variantLetter}`);
    } else {
      // Without variant letter
      variations.push(`BJ-${paddedNumber}`);
      variations.push(`BJ-${unpaddedNumber}`);
      variations.push(`BJ ${paddedNumber}`);
      variations.push(`BJ ${unpaddedNumber}`);
      variations.push(`BJ${paddedNumber}`);
      variations.push(`BJ${unpaddedNumber}`);
    }

    return variations;
  }

  // Fallback for non-BJ formats (P12, PN 0931, etc.)
  return [cleaned, cleaned.replace(/\s+/g, ''), nameWithoutExt.trim().toUpperCase()];
}

async function matchVideosFinal() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Get all products
    const [products] = await sequelize.query(`
      SELECT id, name, sku
      FROM products
      WHERE sku IS NOT NULL
      ORDER BY sku
    `);

    console.log('═══════════════════════════════════════════');
    console.log('FINAL VIDEO MATCHING');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Total products: ${products.length}\n`);

    // Get all video files
    const videoFiles = fs.readdirSync(VIDEOS_FOLDER)
      .filter(file => /\.(mp4|MP4|mov|MOV)$/i.test(file));

    console.log(`Total video files: ${videoFiles.length}\n`);

    const matched = [];
    const unmatched = [];
    const unmatchedReasons = [];

    for (const videoFile of videoFiles) {
      const skuVariations = extractSkuFromFilename(videoFile);

      // Try to find exact match first
      let match = products.find(product => {
        const productSku = product.sku.toUpperCase().trim();
        return skuVariations.some(variation => {
          return productSku === variation.toUpperCase().trim();
        });
      });

      // If no exact match, try to match with any variant of the base SKU (for videos without variant letter)
      if (!match && !videoFile.match(/[A-Z]\.(mp4|MP4|mov|MOV)$/i)) {
        const baseNumberMatch = videoFile.match(/BJ[- ]?0*(\d+)/i);
        if (baseNumberMatch) {
          const baseNum = baseNumberMatch[1];
          match = products.find(product => {
            const sku = product.sku.toUpperCase();
            // Match BJ-XXX(A), BJ-XXX(B), etc. to BJ XXX
            return sku.match(new RegExp(`^BJ-0*${baseNum}\\([A-Z]\\)$`));
          });

          if (match) {
            console.log(`✓ ${videoFile} → ${match.sku} (${match.name}) [Matched to first variant]`);
          }
        }
      }

      if (match) {
        matched.push({
          filename: videoFile,
          productId: match.id,
          productName: match.name,
          sku: match.sku,
          localPath: path.join(VIDEOS_FOLDER, videoFile)
        });
        if (!videoFile.includes('variant')) {
          console.log(`✓ ${videoFile} → ${match.sku} (${match.name})`);
        }
      } else {
        // Determine reason for no match
        let reason = 'No matching SKU found in database';

        if (videoFile.startsWith('P') || videoFile.startsWith('PN')) {
          reason = 'Different product line (not BJ series)';
        } else if (videoFile.match(/118|119/)) {
          reason = 'BJ-118/119 variants not in database';
        } else if (videoFile.match(/\d{3,}/)) {
          reason = 'May have extra digits or formatting issue';
        }

        unmatched.push({
          filename: videoFile,
          triedVariations: skuVariations.slice(0, 3),
          reason,
          localPath: path.join(VIDEOS_FOLDER, videoFile)
        });
        console.log(`✗ ${videoFile} → ${reason}`);
        unmatchedReasons.push(`${videoFile}: ${reason}`);
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('MATCHING RESULTS');
    console.log('═══════════════════════════════════════════\n');
    console.log(`✅ Matched: ${matched.length} (${((matched.length / videoFiles.length) * 100).toFixed(1)}%)`);
    console.log(`❌ Unmatched: ${unmatched.length} (${((unmatched.length / videoFiles.length) * 100).toFixed(1)}%)\n`);

    if (unmatched.length > 0) {
      console.log('═══════════════════════════════════════════');
      console.log('UNMATCHED VIDEOS ANALYSIS');
      console.log('═══════════════════════════════════════════\n');

      const categories = {
        'Different product line': [],
        'Not in database': [],
        'Formatting issues': []
      };

      unmatched.forEach(v => {
        if (v.reason.includes('Different product line')) {
          categories['Different product line'].push(v.filename);
        } else if (v.reason.includes('not in database')) {
          categories['Not in database'].push(v.filename);
        } else {
          categories['Formatting issues'].push(v.filename);
        }
      });

      Object.keys(categories).forEach(category => {
        if (categories[category].length > 0) {
          console.log(`${category} (${categories[category].length}):`);
          categories[category].forEach(f => console.log(`  - ${f}`));
          console.log('');
        }
      });
    }

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      videosFolder: VIDEOS_FOLDER,
      totalVideos: videoFiles.length,
      totalProducts: products.length,
      matchedCount: matched.length,
      unmatchedCount: unmatched.length,
      matchRate: `${((matched.length / videoFiles.length) * 100).toFixed(1)}%`,
      matched,
      unmatched
    };

    const reportPath = path.join(__dirname, 'video-match-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('✓ Report saved to: video-match-report.json');
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('NEXT STEPS');
    console.log('═══════════════════════════════════════════\n');
    console.log(`1. Upload ${matched.length} matched videos to VPS`);
    console.log('2. Update database with video URLs');
    console.log('3. Create API endpoint to serve videos\n');

    await sequelize.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

matchVideosFinal();

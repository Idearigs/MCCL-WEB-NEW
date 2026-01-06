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

async function verifySkuMatching() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Get all products with their SKUs
    const [products] = await sequelize.query(`
      SELECT id, name, sku
      FROM products
      WHERE sku IS NOT NULL
      ORDER BY sku
    `);

    console.log('═══════════════════════════════════════════');
    console.log('DATABASE SKU ANALYSIS');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Total products with SKUs: ${products.length}\n`);

    // Filter BJ- products
    const bjProducts = products.filter(p => p.sku && p.sku.toUpperCase().includes('BJ'));
    console.log(`Products with 'BJ' in SKU: ${bjProducts.length}\n`);

    // Get all video files
    const videoFiles = fs.readdirSync(VIDEOS_FOLDER)
      .filter(file => /\.(mp4|MP4|mov|MOV)$/i.test(file));

    console.log('═══════════════════════════════════════════');
    console.log('VIDEO FILES ANALYSIS');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Total video files: ${videoFiles.length}\n`);

    // Categorize video files
    const bjVideos = videoFiles.filter(f => {
      const nameUpper = f.toUpperCase();
      return nameUpper.includes('BJ') &&
             !['P12', 'P13', 'PN'].some(prefix => nameUpper.startsWith(prefix));
    });

    const nonBjVideos = videoFiles.filter(f => {
      const nameUpper = f.toUpperCase();
      return ['P12', 'P13', 'PN'].some(prefix => nameUpper.startsWith(prefix));
    });

    console.log(`BJ- videos: ${bjVideos.length}`);
    console.log(`Non-BJ videos (P12, P13, PN): ${nonBjVideos.length}\n`);

    console.log('Non-BJ videos:');
    nonBjVideos.forEach(v => console.log(`  - ${v}`));
    console.log('');

    // Extract SKUs from video filenames
    function extractAllSkuVariations(filename) {
      const nameWithoutExt = filename.replace(/\.(mp4|MP4|mov|MOV)$/i, '');
      let base = nameWithoutExt.trim().toUpperCase();

      // Remove common separators and spaces
      const cleaned = base.replace(/\s+/g, '').replace(/-/g, '');

      const variations = [];

      // Original
      variations.push(base);

      // Without spaces
      variations.push(base.replace(/\s+/g, ''));

      // Without hyphens
      variations.push(base.replace(/-/g, ''));

      // Cleaned version
      variations.push(cleaned);

      // BJ prefix variations
      if (cleaned.startsWith('BJ')) {
        const number = cleaned.substring(2);
        variations.push(`BJ-${number}`);
        variations.push(`BJ ${number}`);
        variations.push(`BJ${number}`);

        // Handle variant letters (like BJ101C -> BJ-101, BJ-101C)
        const numberPart = number.match(/^\d+/);
        if (numberPart) {
          const num = numberPart[0];
          const suffix = number.substring(num.length);
          variations.push(`BJ-${num}`);
          variations.push(`BJ ${num}`);
          variations.push(`BJ${num}`);
          if (suffix) {
            variations.push(`BJ-${num}${suffix}`);
            variations.push(`BJ ${num}${suffix}`);
            variations.push(`BJ${num}${suffix}`);
            variations.push(`BJ-${num} ${suffix}`);
          }
        }
      }

      return [...new Set(variations)];
    }

    // Create mapping of videos to potential SKU matches
    console.log('═══════════════════════════════════════════');
    console.log('DETAILED MATCHING ANALYSIS');
    console.log('═══════════════════════════════════════════\n');

    const matchedVideos = [];
    const unmatchedVideos = [];

    bjVideos.forEach(videoFile => {
      const skuVariations = extractAllSkuVariations(videoFile);

      // Try to find a match in products
      const match = products.find(product => {
        const productSku = product.sku.toUpperCase();
        return skuVariations.some(variation => {
          return productSku === variation ||
                 productSku.replace(/\s+/g, '') === variation.replace(/\s+/g, '') ||
                 productSku.replace(/-/g, '') === variation.replace(/-/g, '');
        });
      });

      if (match) {
        matchedVideos.push({
          videoFile,
          sku: match.sku,
          productName: match.name,
          productId: match.id
        });
      } else {
        unmatchedVideos.push({
          videoFile,
          variations: skuVariations
        });
      }
    });

    console.log(`✅ MATCHED: ${matchedVideos.length} videos`);
    console.log(`❌ UNMATCHED: ${unmatchedVideos.length} videos\n`);

    console.log('═══════════════════════════════════════════');
    console.log('UNMATCHED VIDEOS DETAILED BREAKDOWN');
    console.log('═══════════════════════════════════════════\n');

    unmatchedVideos.forEach((item, index) => {
      console.log(`${index + 1}. ${item.videoFile}`);
      console.log(`   Tried variations: ${item.variations.slice(0, 5).join(', ')}`);

      // Check if any similar SKU exists
      const similarSkus = bjProducts.filter(p => {
        const pSku = p.sku.toUpperCase().replace(/[^A-Z0-9]/g, '');
        return item.variations.some(v => {
          const vClean = v.replace(/[^A-Z0-9]/g, '');
          return pSku.includes(vClean.substring(0, 5)) || vClean.includes(pSku.substring(0, 5));
        });
      });

      if (similarSkus.length > 0) {
        console.log(`   Similar SKUs in DB: ${similarSkus.map(p => p.sku).join(', ')}`);
      } else {
        console.log(`   No similar SKUs found in database`);
      }
      console.log('');
    });

    // Show all BJ SKUs in database
    console.log('═══════════════════════════════════════════');
    console.log('ALL BJ- SKUs IN DATABASE');
    console.log('═══════════════════════════════════════════\n');

    bjProducts.forEach((p, index) => {
      console.log(`${index + 1}. ${p.sku} - ${p.name}`);
    });
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Total video files: ${videoFiles.length}`);
    console.log(`BJ- videos: ${bjVideos.length}`);
    console.log(`Non-BJ videos: ${nonBjVideos.length}`);
    console.log(`BJ- products in DB: ${bjProducts.length}`);
    console.log(`Matched: ${matchedVideos.length}`);
    console.log(`Unmatched: ${unmatchedVideos.length}`);
    console.log(`Match rate: ${((matchedVideos.length / bjVideos.length) * 100).toFixed(1)}%\n`);

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalVideos: videoFiles.length,
        bjVideos: bjVideos.length,
        nonBjVideos: nonBjVideos.length,
        bjProductsInDb: bjProducts.length,
        matched: matchedVideos.length,
        unmatched: unmatchedVideos.length,
        matchRate: `${((matchedVideos.length / bjVideos.length) * 100).toFixed(1)}%`
      },
      allBjSkusInDatabase: bjProducts.map(p => ({ sku: p.sku, name: p.name })),
      matchedVideos,
      unmatchedVideos,
      nonBjVideos
    };

    fs.writeFileSync(
      path.join(__dirname, 'sku-verification-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('✓ Detailed report saved to: sku-verification-report.json\n');

    await sequelize.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifySkuMatching();

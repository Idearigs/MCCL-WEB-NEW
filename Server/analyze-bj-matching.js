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

async function analyzeBJMatching() {
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
    console.log('BJ-PREFIXED PRODUCTS IN DATABASE');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Total BJ products in database: ${products.length}\n`);

    // Get all video files
    const videoFiles = fs.readdirSync(VIDEO_DIR)
      .filter(file => /\.(mp4|MP4|mov|MOV)$/i.test(file));

    console.log(`Total video files: ${videoFiles.length}\n`);

    // Filter BJ videos (exclude P12, P13, PN0931)
    const bjVideos = videoFiles.filter(file => {
      const nameWithoutExt = file.replace(/\.(mp4|MP4|mov|MOV)$/i, '');
      const upperName = nameWithoutExt.toUpperCase();

      // Exclude non-BJ videos
      if (upperName === 'P12' || upperName === 'P13' || upperName === 'PN0931') {
        return false;
      }

      // Include if it starts with BJ or contains BJ
      return upperName.includes('BJ');
    });

    console.log(`BJ-prefixed videos (excluding P12, P13, PN0931): ${bjVideos.length}\n`);

    // Create SKU map from database
    const skuMap = new Map();
    products.forEach(product => {
      const sku = product.sku.toUpperCase();
      skuMap.set(sku, product);

      // Also add variations
      const variations = [
        sku.replace(/-/g, ''),           // Remove hyphens: BJ-001 -> BJ001
        sku.replace(/-/g, ' '),          // Hyphen to space: BJ-001 -> BJ 001
        sku.replace(/\s+/g, ''),         // Remove spaces: BJ 001 -> BJ001
        sku.replace(/\s+/g, '-'),        // Space to hyphen: BJ 001 -> BJ-001
      ];

      variations.forEach(v => {
        if (!skuMap.has(v)) {
          skuMap.set(v, product);
        }
      });
    });

    console.log('═══════════════════════════════════════════');
    console.log('DETAILED MATCHING ANALYSIS');
    console.log('═══════════════════════════════════════════\n');

    const matched = [];
    const unmatched = [];

    bjVideos.forEach(filename => {
      const nameWithoutExt = filename.replace(/\.(mp4|MP4|mov|MOV)$/i, '');
      let foundMatch = false;

      // Try various SKU extraction patterns
      const patterns = [
        nameWithoutExt.trim().toUpperCase(),                          // Original
        nameWithoutExt.replace(/\s+/g, '').toUpperCase(),            // No spaces
        nameWithoutExt.replace(/\s+/g, '-').toUpperCase(),           // Spaces to hyphens
        nameWithoutExt.replace(/-/g, '').toUpperCase(),              // No hyphens
        nameWithoutExt.replace(/-/g, ' ').toUpperCase(),             // Hyphens to spaces
        nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),   // Alphanumeric only
      ];

      // Also try extracting just the BJ code part
      const bjMatch = nameWithoutExt.match(/BJ\s*-?\s*\d+\s*[A-Z]*/i);
      if (bjMatch) {
        const bjCode = bjMatch[0].toUpperCase();
        patterns.push(bjCode);
        patterns.push(bjCode.replace(/\s+/g, ''));
        patterns.push(bjCode.replace(/\s+/g, '-'));
        patterns.push(bjCode.replace(/-/g, ''));
        patterns.push(bjCode.replace(/-/g, ' '));
      }

      // Remove duplicates
      const uniquePatterns = [...new Set(patterns)];

      for (const pattern of uniquePatterns) {
        if (skuMap.has(pattern)) {
          const product = skuMap.get(pattern);
          matched.push({
            filename,
            matchedPattern: pattern,
            productSKU: product.sku,
            productName: product.name,
            productId: product.id
          });
          foundMatch = true;
          break;
        }
      }

      if (!foundMatch) {
        unmatched.push({
          filename,
          triedPatterns: uniquePatterns
        });
      }
    });

    console.log(`✅ Matched: ${matched.length}`);
    console.log(`❌ Unmatched: ${unmatched.length}\n`);

    // Show unmatched videos
    if (unmatched.length > 0) {
      console.log('═══════════════════════════════════════════');
      console.log('UNMATCHED BJ VIDEOS');
      console.log('═══════════════════════════════════════════\n');

      unmatched.forEach(item => {
        console.log(`❌ ${item.filename}`);
        console.log(`   Tried: ${item.triedPatterns.slice(0, 5).join(', ')}...`);
      });
      console.log('');
    }

    // Sample matched videos
    console.log('═══════════════════════════════════════════');
    console.log('SAMPLE MATCHED VIDEOS (first 10)');
    console.log('═══════════════════════════════════════════\n');

    matched.slice(0, 10).forEach(item => {
      console.log(`✓ ${item.filename}`);
      console.log(`  → Matched SKU: ${item.productSKU} (${item.productName})`);
      console.log(`  → Pattern used: ${item.matchedPattern}`);
    });
    console.log('');

    // Show all database SKUs for comparison
    console.log('═══════════════════════════════════════════');
    console.log('ALL BJ SKUS IN DATABASE');
    console.log('═══════════════════════════════════════════\n');

    products.forEach(product => {
      console.log(`${product.sku} - ${product.name}`);
    });
    console.log('');

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalBJProductsInDB: products.length,
        totalBJVideos: bjVideos.length,
        matched: matched.length,
        unmatched: unmatched.length,
        matchRate: `${((matched.length / bjVideos.length) * 100).toFixed(1)}%`
      },
      matched,
      unmatched,
      databaseSKUs: products.map(p => ({ sku: p.sku, name: p.name }))
    };

    fs.writeFileSync(
      path.join(__dirname, 'bj-matching-analysis.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('✓ Detailed report saved to: bj-matching-analysis.json\n');

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

analyzeBJMatching();

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

// Failed SKUs from the import
const failedSKUs = [
  '21536.SA.UB.25.NIB',
  '21536.SA.UB.33.NMB',
  '21536.SA.UBR.30.NT',
  '21536.SA.UG.26.NOL',
  '21536.SA.UGW.29.NGW',
  '17536.SA.T.1.NB',
  '17536.SA.T.2.NT',
  '15140.SA.T.10.NBG',
  '19140.SA.T.25.NIB',
  '19140.SA.T.30.NT',
  '20140.PYA.T.38.NTC',
  '20140.PYAT.37.NTCH',
  '20140.SA.T.37.NTCH',
  '20140.SA.T.38.NTC',
  '19140.PYA.T.26.NOL',
  '19140.SA.T.26.NOL'
];

async function checkFailedSKUs() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Load the extracted collections data
    const collectionsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'briston-collections-extracted.json'), 'utf8')
    );

    console.log('═══════════════════════════════════════════');
    console.log('ANALYZING FAILED SKU IMPORTS');
    console.log('═══════════════════════════════════════════\n');

    // Check for duplicate SKUs in the extracted data
    console.log('STEP 1: Checking for duplicate SKUs in Excel data\n');

    const allWatches = [];
    collectionsData.collections.forEach(collection => {
      collection.watches.forEach(watch => {
        allWatches.push({
          sku: watch.styleNumber,
          description: watch.description,
          collection: collection.name
        });
      });
    });

    const skuCounts = new Map();
    allWatches.forEach(watch => {
      const count = skuCounts.get(watch.sku) || 0;
      skuCounts.set(watch.sku, count + 1);
    });

    const duplicatesInExcel = Array.from(skuCounts.entries())
      .filter(([sku, count]) => count > 1)
      .map(([sku]) => sku);

    if (duplicatesInExcel.length > 0) {
      console.log('⚠️  Found duplicate SKUs in Excel data:');
      duplicatesInExcel.forEach(sku => {
        const watches = allWatches.filter(w => w.sku === sku);
        console.log(`\n  ${sku} (appears ${watches.length} times):`);
        watches.forEach((w, i) => {
          console.log(`    ${i + 1}. ${w.collection} - ${w.description}`);
        });
      });
      console.log('');
    } else {
      console.log('✓ No duplicate SKUs found in Excel data\n');
    }

    // Check if failed SKUs already exist in database
    console.log('STEP 2: Checking if failed SKUs exist in database\n');

    for (const sku of failedSKUs) {
      const [result] = await sequelize.query(`
        SELECT w.id, w.sku, w.name, b.name as brand_name, c.name as collection_name
        FROM watches w
        LEFT JOIN watch_brands b ON w.brand_id = b.id
        LEFT JOIN watch_collections c ON w.collection_id = c.id
        WHERE w.sku = :sku
      `, {
        replacements: { sku }
      });

      if (result.length > 0) {
        const watch = result[0];
        console.log(`  ✓ ${sku} EXISTS in database:`);
        console.log(`    Brand: ${watch.brand_name}`);
        console.log(`    Collection: ${watch.collection_name}`);
        console.log(`    Name: ${watch.name}`);
      } else {
        console.log(`  ✗ ${sku} NOT FOUND in database`);
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Total failed SKUs: ${failedSKUs.length}`);
    console.log(`Duplicate SKUs in Excel: ${duplicatesInExcel.length}`);
    console.log('');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkFailedSKUs();

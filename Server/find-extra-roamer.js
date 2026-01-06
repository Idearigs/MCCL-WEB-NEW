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

async function findExtraRoamer() {
  try {
    await sequelize.authenticate();

    // Load the expected collections from JSON
    const collectionsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'roamer-collections-extracted.json'), 'utf8')
    );

    const expectedCollections = collectionsData.collections.map(c => c.name);
    const expectedSKUs = [];
    collectionsData.collections.forEach(c => {
      c.watches.forEach(w => {
        expectedSKUs.push(w.styleNumber);
      });
    });

    // Get Roamer brand
    const [roamerBrand] = await sequelize.query(`
      SELECT id FROM watch_brands WHERE LOWER(name) = 'roamer'
    `);

    const brandId = roamerBrand[0].id;

    // Get all Roamer collections from database
    const [dbCollections] = await sequelize.query(`
      SELECT name FROM watch_collections WHERE brand_id = :brand_id ORDER BY name
    `, {
      replacements: { brand_id: brandId }
    });

    const dbCollectionNames = dbCollections.map(c => c.name);

    // Find extra collections
    const extraCollections = dbCollectionNames.filter(name => !expectedCollections.includes(name));

    console.log('Extra Roamer Collections:\n');
    if (extraCollections.length > 0) {
      extraCollections.forEach(name => {
        console.log(`  - ${name}`);
      });
    } else {
      console.log('  None found');
    }

    // Get all Roamer watches from database
    const [dbWatches] = await sequelize.query(`
      SELECT sku, name FROM watches WHERE brand_id = :brand_id ORDER BY sku
    `, {
      replacements: { brand_id: brandId }
    });

    const dbSKUs = dbWatches.map(w => w.sku);

    // Find extra watches
    const extraWatches = dbWatches.filter(w => !expectedSKUs.includes(w.sku));

    console.log('\nExtra Roamer Watches:\n');
    if (extraWatches.length > 0) {
      extraWatches.forEach(w => {
        console.log(`  - ${w.sku}: ${w.name}`);
      });
    } else {
      console.log('  None found');
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

findExtraRoamer();

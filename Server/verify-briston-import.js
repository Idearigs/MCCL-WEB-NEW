const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  host: '31.97.116.89',
  port: 5432,
  database: 'mcculloch_db',
  username: 'mcculloch_admin',
  password: '#mcculloch_admin#20026',
  dialect: 'postgres',
  logging: false
});

async function verifyImport() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Get Briston brand
    const [brandResult] = await sequelize.query(`
      SELECT id, name FROM watch_brands WHERE LOWER(name) = 'briston'
    `);

    if (brandResult.length === 0) {
      console.log('❌ Briston brand not found\n');
      return;
    }

    const brandId = brandResult[0].id;

    // Count collections
    const [collectionCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM watch_collections WHERE brand_id = :brand_id
    `, {
      replacements: { brand_id: brandId }
    });

    // Count watches
    const [watchCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM watches WHERE brand_id = :brand_id
    `, {
      replacements: { brand_id: brandId }
    });

    // Get watch details by collection
    const [watchesByCollection] = await sequelize.query(`
      SELECT
        c.name as collection_name,
        COUNT(w.id) as watch_count
      FROM watch_collections c
      LEFT JOIN watches w ON w.collection_id = c.id
      WHERE c.brand_id = :brand_id
      GROUP BY c.id, c.name
      ORDER BY c.name
    `, {
      replacements: { brand_id: brandId }
    });

    console.log('═══════════════════════════════════════════');
    console.log('BRISTON IMPORT VERIFICATION');
    console.log('═══════════════════════════════════════════\n');

    console.log(`Brand: ${brandResult[0].name}`);
    console.log(`Total Collections: ${collectionCount[0].count}`);
    console.log(`Total Watches: ${watchCount[0].count}\n`);

    console.log('WATCHES BY COLLECTION:\n');

    watchesByCollection.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.collection_name}`);
      console.log(`   Watches: ${collection.watch_count}`);
    });

    console.log('\n═══════════════════════════════════════════');
    console.log('VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════\n');

    const expectedWatches = 93;
    const expectedCollections = 19;

    if (watchCount[0].count == expectedWatches) {
      console.log(`✅ SUCCESS: All ${expectedWatches} watches imported!`);
    } else {
      console.log(`❌ MISMATCH: Expected ${expectedWatches} watches, found ${watchCount[0].count}`);
    }

    if (collectionCount[0].count == expectedCollections) {
      console.log(`✅ SUCCESS: All ${expectedCollections} collections created!`);
    } else {
      console.log(`⚠️  MISMATCH: Expected ${expectedCollections} collections, found ${collectionCount[0].count}`);
    }

    console.log('');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyImport();

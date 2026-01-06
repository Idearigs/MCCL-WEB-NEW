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

async function verifyAllImports() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    console.log('═══════════════════════════════════════════');
    console.log('COMPLETE IMPORT VERIFICATION');
    console.log('═══════════════════════════════════════════\n');

    // Get Briston stats
    const [bristonBrand] = await sequelize.query(`
      SELECT id, name FROM watch_brands WHERE LOWER(name) = 'briston'
    `);

    if (bristonBrand.length > 0) {
      const brandId = bristonBrand[0].id;

      const [collectionCount] = await sequelize.query(`
        SELECT COUNT(*) as count FROM watch_collections WHERE brand_id = :brand_id
      `, {
        replacements: { brand_id: brandId }
      });

      const [watchCount] = await sequelize.query(`
        SELECT COUNT(*) as count FROM watches WHERE brand_id = :brand_id
      `, {
        replacements: { brand_id: brandId }
      });

      console.log('BRISTON:');
      console.log(`  Collections: ${collectionCount[0].count}`);
      console.log(`  Watches: ${watchCount[0].count}`);
      console.log(`  Expected: 19 collections, 93 watches`);

      if (collectionCount[0].count == 19 && watchCount[0].count == 93) {
        console.log('  Status: ✅ PERFECT\n');
      } else {
        console.log('  Status: ⚠️  MISMATCH\n');
      }
    }

    // Get Roamer stats
    const [roamerBrand] = await sequelize.query(`
      SELECT id, name FROM watch_brands WHERE LOWER(name) = 'roamer'
    `);

    if (roamerBrand.length > 0) {
      const brandId = roamerBrand[0].id;

      const [collectionCount] = await sequelize.query(`
        SELECT COUNT(*) as count FROM watch_collections WHERE brand_id = :brand_id
      `, {
        replacements: { brand_id: brandId }
      });

      const [watchCount] = await sequelize.query(`
        SELECT COUNT(*) as count FROM watches WHERE brand_id = :brand_id
      `, {
        replacements: { brand_id: brandId }
      });

      console.log('ROAMER:');
      console.log(`  Collections: ${collectionCount[0].count}`);
      console.log(`  Watches: ${watchCount[0].count}`);
      console.log(`  Expected: 92 collections, 184 watches`);

      if (collectionCount[0].count == 92 && watchCount[0].count == 184) {
        console.log('  Status: ✅ PERFECT\n');
      } else {
        console.log('  Status: ⚠️  MISMATCH\n');
      }
    }

    // Total stats
    const [totalCollections] = await sequelize.query(`
      SELECT COUNT(*) as count FROM watch_collections
    `);

    const [totalWatches] = await sequelize.query(`
      SELECT COUNT(*) as count FROM watches
    `);

    console.log('═══════════════════════════════════════════');
    console.log('TOTAL DATABASE STATS');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Total Collections: ${totalCollections[0].count}`);
    console.log(`Total Watches: ${totalWatches[0].count}`);
    console.log('');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyAllImports();

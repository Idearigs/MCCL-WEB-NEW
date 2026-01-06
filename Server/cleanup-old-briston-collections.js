require('dotenv').config();
const { Sequelize } = require('sequelize');

async function cleanupOldBristonCollections() {
  const sequelize = new Sequelize(
    process.env.PG_DATABASE,
    process.env.PG_USERNAME,
    process.env.PG_PASSWORD,
    {
      host: process.env.PG_HOST,
      port: process.env.PG_PORT || 5432,
      dialect: 'postgres',
      logging: false
    }
  );

  try {
    console.log('\n' + '='.repeat(70));
    console.log('  CLEANUP OLD BRISTON COLLECTIONS');
    console.log('='.repeat(70));

    await sequelize.authenticate();
    console.log('\n✓ Database connected');

    // Get Briston brand ID
    const bristonBrand = await sequelize.query(`
      SELECT id, name FROM watch_brands
      WHERE LOWER(name) = 'briston'
      LIMIT 1
    `, { type: Sequelize.QueryTypes.SELECT });

    if (bristonBrand.length === 0) {
      console.log('⚠️  Briston brand not found');
      return;
    }

    const bristonBrandId = bristonBrand[0].id;
    console.log(`✓ Found Briston brand (ID: ${bristonBrandId})`);

    // Find all Briston collections with their watch counts
    console.log('\n📋 Analyzing Briston Collections...');

    const collections = await sequelize.query(`
      SELECT
        wc.id,
        wc.name,
        wc.slug,
        wc.is_active,
        COUNT(w.id) as watch_count
      FROM watch_collections wc
      LEFT JOIN watches w ON w.collection_id = wc.id
      WHERE wc.brand_id = :brandId
      GROUP BY wc.id, wc.name, wc.slug, wc.is_active
      ORDER BY watch_count DESC
    `, {
      replacements: { brandId: bristonBrandId },
      type: Sequelize.QueryTypes.SELECT
    });

    console.log(`\nFound ${collections.length} Briston collections`);

    // Separate active collections with watches vs empty collections
    const activeCollections = collections.filter(c => parseInt(c.watch_count) > 0);
    const emptyCollections = collections.filter(c => parseInt(c.watch_count) === 0);

    console.log(`\nCollections with watches (${activeCollections.length}):`);
    activeCollections.forEach(c => {
      console.log(`  ✓ ${c.name}: ${c.watch_count} watches`);
    });

    console.log(`\nEmpty collections to remove (${emptyCollections.length}):`);
    emptyCollections.forEach(c => {
      console.log(`  • ${c.name} (0 watches)`);
    });

    if (emptyCollections.length === 0) {
      console.log('\n✓ No empty collections to clean up!');
      return;
    }

    // Delete empty collections
    console.log(`\n🗑️  Deleting ${emptyCollections.length} empty collections...`);

    for (const collection of emptyCollections) {
      await sequelize.query(`
        DELETE FROM watch_collections
        WHERE id = :collectionId
      `, {
        replacements: { collectionId: collection.id },
        type: Sequelize.QueryTypes.DELETE
      });

      console.log(`  ✓ Deleted: ${collection.name}`);
    }

    // Verification
    console.log('\n📊 Verification...');

    const remainingCollections = await sequelize.query(`
      SELECT
        wc.name,
        COUNT(w.id) as watch_count
      FROM watch_collections wc
      LEFT JOIN watches w ON w.collection_id = wc.id
      WHERE wc.brand_id = :brandId
      GROUP BY wc.id, wc.name
      ORDER BY watch_count DESC
    `, {
      replacements: { brandId: bristonBrandId },
      type: Sequelize.QueryTypes.SELECT
    });

    console.log('\nRemaining Briston collections:');
    remainingCollections.forEach(c => {
      console.log(`  • ${c.name}: ${c.watch_count} watches`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ SUCCESS! Old collections cleaned up!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.\n');
  }
}

console.log('\n🚀 Starting cleanup...\n');

cleanupOldBristonCollections()
  .then(() => {
    console.log('✅ Cleanup completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed!');
    console.error('Error:', error.message);
    process.exit(1);
  });

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

async function removeTestProducts() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    console.log('═══════════════════════════════════════════');
    console.log('REMOVING TEST PRODUCTS');
    console.log('═══════════════════════════════════════════\n');

    // First, let's identify test products
    // Test products include:
    // 1. The old Briston test watch: "GeorgeBT" (SKU: d333)
    // 2. "Briston Heritage Collection" which was a test collection

    // Get test watches
    const [testWatches] = await sequelize.query(`
      SELECT w.id, w.name, w.sku, w.model_number, c.name as collection_name, b.name as brand_name
      FROM watches w
      LEFT JOIN watch_collections c ON w.collection_id = c.id
      LEFT JOIN watch_brands b ON w.brand_id = b.id
      WHERE w.sku = 'd333'
         OR w.name LIKE '%test%'
         OR w.name LIKE '%Test%'
         OR w.name LIKE '%GeorgeBT%'
      ORDER BY w.created_at
    `);

    if (testWatches.length > 0) {
      console.log('Test watches found:\n');
      testWatches.forEach(watch => {
        console.log(`  - ${watch.name} (SKU: ${watch.sku})`);
        console.log(`    Brand: ${watch.brand_name}, Collection: ${watch.collection_name}`);
      });

      console.log(`\nDeleting ${testWatches.length} test watches...`);

      for (const watch of testWatches) {
        await sequelize.query(`
          DELETE FROM watches WHERE id = :id
        `, {
          replacements: { id: watch.id }
        });
        console.log(`  ✓ Deleted: ${watch.name}`);
      }

      console.log('');
    } else {
      console.log('No test watches found.\n');
    }

    // Get test collections (Briston Heritage Collection)
    const [testCollections] = await sequelize.query(`
      SELECT id, name, brand_id
      FROM watch_collections
      WHERE name LIKE '%Heritage%'
         OR name LIKE '%test%'
         OR name LIKE '%Test%'
    `);

    if (testCollections.length > 0) {
      console.log('Test collections found:\n');
      testCollections.forEach(collection => {
        console.log(`  - ${collection.name}`);
      });

      console.log(`\nDeleting ${testCollections.length} test collections...`);

      for (const collection of testCollections) {
        // Check if collection has any watches
        const [watchCount] = await sequelize.query(`
          SELECT COUNT(*) as count FROM watches WHERE collection_id = :id
        `, {
          replacements: { id: collection.id }
        });

        if (watchCount[0].count > 0) {
          console.log(`  ⚠️  Skipping ${collection.name} - has ${watchCount[0].count} watches`);
        } else {
          await sequelize.query(`
            DELETE FROM watch_collections WHERE id = :id
          `, {
            replacements: { id: collection.id }
          });
          console.log(`  ✓ Deleted: ${collection.name}`);
        }
      }

      console.log('');
    } else {
      console.log('No test collections found.\n');
    }

    console.log('═══════════════════════════════════════════');
    console.log('CLEANUP COMPLETE');
    console.log('═══════════════════════════════════════════\n');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

removeTestProducts();

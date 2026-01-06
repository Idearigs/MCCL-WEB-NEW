require('dotenv').config();
const { Sequelize } = require('sequelize');

async function reorganizeBristonCollections() {
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
    console.log('  REORGANIZE BRISTON WATCHES INTO NEW COLLECTIONS');
    console.log('='.repeat(70));

    await sequelize.authenticate();
    console.log('\n✓ Database connected');

    // Step 1: Get Briston brand ID
    console.log('\n📋 Step 1: Finding Briston Brand...');

    const bristonBrand = await sequelize.query(`
      SELECT id, name FROM watch_brands
      WHERE LOWER(name) = 'briston'
      LIMIT 1
    `, { type: Sequelize.QueryTypes.SELECT });

    if (bristonBrand.length === 0) {
      console.log('⚠️  Briston brand not found in database');
      return;
    }

    const bristonBrandId = bristonBrand[0].id;
    console.log(`✓ Found Briston brand (ID: ${bristonBrandId})`);

    // Step 2: Check current Briston watches and their collections
    console.log('\n📋 Step 2: Analyzing Briston Watches...');

    const bristonWatches = await sequelize.query(`
      SELECT
        w.id,
        w.model_number,
        w.name,
        wc.id as collection_id,
        wc.name as collection_name
      FROM watches w
      LEFT JOIN watch_collections wc ON w.collection_id = wc.id
      WHERE w.brand_id = :brandId
      ORDER BY w.model_number
    `, {
      replacements: { brandId: bristonBrandId },
      type: Sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${bristonWatches.length} Briston watches`);

    if (bristonWatches.length === 0) {
      console.log('⚠️  No Briston watches found in database');
      return;
    }

    console.log('\nCurrent watch distribution:');
    const collectionCounts = bristonWatches.reduce((acc, watch) => {
      const collName = watch.collection_name || 'No Collection';
      acc[collName] = (acc[collName] || 0) + 1;
      return acc;
    }, {});

    Object.entries(collectionCounts).forEach(([name, count]) => {
      console.log(`  • ${name}: ${count} watches`);
    });

    // Step 3: Get or create new collections
    console.log('\n📋 Step 3: Setting up Collections...');

    const newCollections = [
      {
        name: 'Clubmaster Collection',
        slug: 'clubmaster-collection',
        description: 'The iconic Clubmaster collection featuring vintage-inspired designs with modern precision.',
        brand_id: bristonBrandId
      },
      {
        name: 'Streamliner Collection',
        slug: 'streamliner-collection',
        description: 'Sleek and contemporary timepieces from the Streamliner collection.',
        brand_id: bristonBrandId
      },
      {
        name: 'Trendsetters Collection',
        slug: 'trendsetters-collection',
        description: 'Bold and innovative designs for the modern trendsetter.',
        brand_id: bristonBrandId
      }
    ];

    const collectionIds = {};

    for (const coll of newCollections) {
      // Check if collection exists
      const existing = await sequelize.query(`
        SELECT id, name, slug FROM watch_collections
        WHERE LOWER(slug) = LOWER(:slug)
        LIMIT 1
      `, {
        replacements: { slug: coll.slug },
        type: Sequelize.QueryTypes.SELECT
      });

      if (existing.length > 0) {
        console.log(`  ✓ Found existing: ${coll.name}`);
        collectionIds[coll.name] = existing[0].id;
      } else {
        // Create new collection
        const [newColl] = await sequelize.query(`
          INSERT INTO watch_collections (id, name, slug, description, brand_id, is_active, created_at, updated_at)
          VALUES (gen_random_uuid(), :name, :slug, :description, :brand_id, true, NOW(), NOW())
          RETURNING id, name, slug
        `, {
          replacements: coll,
          type: Sequelize.QueryTypes.INSERT
        });

        console.log(`  ✓ Created new: ${coll.name}`);
        collectionIds[coll.name] = newColl[0].id;
      }
    }

    // Step 4: Display sample watches for categorization
    console.log('\n📋 Step 4: Sample Briston Watches:');
    bristonWatches.slice(0, 10).forEach(watch => {
      console.log(`  • ${watch.model_number} - ${watch.name}`);
    });

    // Step 5: Organize watches based on model patterns
    console.log('\n🔄 Step 5: Organizing Watches into Collections...');

    let clubmasterCount = 0;
    let streamlinerCount = 0;
    let trendsettersCount = 0;

    for (const watch of bristonWatches) {
      let targetCollection = null;
      const modelLower = (watch.model_number || '').toLowerCase();
      const nameLower = (watch.name || '').toLowerCase();

      // Categorize based on model number or name
      if (modelLower.includes('clubmaster') || nameLower.includes('clubmaster')) {
        targetCollection = 'Clubmaster Collection';
        clubmasterCount++;
      } else if (modelLower.includes('streamliner') || nameLower.includes('streamliner')) {
        targetCollection = 'Streamliner Collection';
        streamlinerCount++;
      } else {
        // Default to Trendsetters for others
        targetCollection = 'Trendsetters Collection';
        trendsettersCount++;
      }

      // Update watch collection
      await sequelize.query(`
        UPDATE watches
        SET collection_id = :collectionId,
            updated_at = NOW()
        WHERE id = :watchId
      `, {
        replacements: {
          collectionId: collectionIds[targetCollection],
          watchId: watch.id
        },
        type: Sequelize.QueryTypes.UPDATE
      });
    }

    console.log('\n✓ Watches organized:');
    console.log(`  • Clubmaster Collection: ${clubmasterCount} watches`);
    console.log(`  • Streamliner Collection: ${streamlinerCount} watches`);
    console.log(`  • Trendsetters Collection: ${trendsettersCount} watches`);

    // Step 6: Verification
    console.log('\n📊 Step 6: Verification...');

    const verification = await sequelize.query(`
      SELECT
        wc.name as collection_name,
        COUNT(w.id) as watch_count
      FROM watches w
      JOIN watch_collections wc ON w.collection_id = wc.id
      WHERE w.brand_id = :brandId
      GROUP BY wc.name
      ORDER BY watch_count DESC
    `, {
      replacements: { brandId: bristonBrandId },
      type: Sequelize.QueryTypes.SELECT
    });

    console.log('\nFinal distribution:');
    verification.forEach(result => {
      console.log(`  • ${result.collection_name}: ${result.watch_count} watches`);
    });

    const unassigned = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM watches
      WHERE brand_id = :brandId AND collection_id IS NULL
    `, {
      replacements: { brandId: bristonBrandId },
      type: Sequelize.QueryTypes.SELECT
    });

    console.log(`\nWatches without collection: ${unassigned[0].count}`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ SUCCESS! Briston watches reorganized into new collections!');
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

console.log('\n🚀 Starting Briston collection reorganization...\n');

reorganizeBristonCollections()
  .then(() => {
    console.log('✅ Script completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed!');
    console.error('Error:', error.message);
    process.exit(1);
  });

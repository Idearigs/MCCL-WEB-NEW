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

// Load the extracted collections data
const collectionsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'briston-collections-extracted.json'), 'utf8')
);

function createSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function importBristonWatches() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    console.log('═══════════════════════════════════════════');
    console.log('BRISTON WATCHES IMPORT');
    console.log('═══════════════════════════════════════════\n');

    // STEP 1: Create or get Briston brand
    console.log('STEP 1: Creating/Verifying Briston Brand\n');

    let [bristonBrand] = await sequelize.query(`
      SELECT id, name FROM watch_brands WHERE LOWER(name) = 'briston'
    `);

    let brandId;

    if (bristonBrand.length > 0) {
      brandId = bristonBrand[0].id;
      console.log(`✓ Briston brand already exists (ID: ${brandId})\n`);
    } else {
      const [result] = await sequelize.query(`
        INSERT INTO watch_brands (
          name, slug, description, is_active, sort_order, created_at, updated_at
        ) VALUES (
          'Briston',
          'briston',
          'Briston watches combine French design elegance with Swiss precision craftsmanship.',
          true,
          0,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        ) RETURNING id
      `);
      brandId = result[0].id;
      console.log(`✓ Created Briston brand (ID: ${brandId})\n`);
    }

    // STEP 2: Create collections
    console.log('STEP 2: Creating Watch Collections\n');

    const collectionMap = new Map();
    let collectionCount = 0;

    for (const collection of collectionsData.collections) {
      const slug = createSlug(collection.name);

      // Check if collection exists
      const [existing] = await sequelize.query(`
        SELECT id FROM watch_collections
        WHERE brand_id = :brand_id AND slug = :slug
      `, {
        replacements: { brand_id: brandId, slug }
      });

      let collectionId;

      if (existing.length > 0) {
        collectionId = existing[0].id;
        console.log(`  ✓ Collection exists: "${collection.name}" (${collection.count} watches)`);
      } else {
        const [result] = await sequelize.query(`
          INSERT INTO watch_collections (
            id, brand_id, name, slug, is_featured, is_active, sort_order, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), :brand_id, :name, :slug, false, true, :sort_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          ) RETURNING id
        `, {
          replacements: {
            brand_id: brandId,
            name: collection.name,
            slug,
            sort_order: collectionCount
          }
        });
        collectionId = result[0].id;
        collectionCount++;
        console.log(`  ✓ Created collection: "${collection.name}" (${collection.count} watches)`);
      }

      collectionMap.set(collection.name, collectionId);
    }

    console.log(`\n✓ ${collectionCount} collections created/verified\n`);

    // STEP 3: Import watches
    console.log('STEP 3: Importing Watches\n');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const collection of collectionsData.collections) {
      const collectionId = collectionMap.get(collection.name);

      console.log(`\nCollection: ${collection.name}`);

      for (const watch of collection.watches) {
        try {
          // Check if watch exists by SKU
          const [existing] = await sequelize.query(`
            SELECT id FROM watches WHERE sku = :sku
          `, {
            replacements: { sku: watch.styleNumber }
          });

          if (existing.length > 0) {
            skipCount++;
            continue;
          }

          // Include SKU in slug to ensure uniqueness for watches with identical descriptions
          const slug = createSlug(`${watch.description || watch.styleNumber}-${watch.styleNumber}`);
          const baseCost = parseFloat(watch.cost) || 0;

          await sequelize.query(`
            INSERT INTO watches (
              id,
              brand_id,
              collection_id,
              name,
              slug,
              model_number,
              description,
              base_price,
              currency,
              sku,
              is_active,
              is_featured,
              in_stock,
              stock_quantity,
              created_at,
              updated_at,
              technical_specs
            ) VALUES (
              gen_random_uuid(),
              :brand_id,
              :collection_id,
              :name,
              :slug,
              :model_number,
              :description,
              :base_price,
              'GBP',
              :sku,
              true,
              false,
              true,
              10,
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP,
              :technical_specs
            )
          `, {
            replacements: {
              brand_id: brandId,
              collection_id: collectionId,
              name: watch.description || watch.styleNumber,
              slug,
              model_number: watch.styleNumber,
              description: watch.description,
              base_price: watch.rrp || baseCost * 2,
              sku: watch.styleNumber,
              technical_specs: JSON.stringify({
                color_finish: watch.color,
                cost: baseCost,
                rrp: watch.rrp
              })
            }
          });

          successCount++;
          console.log(`  ✓ ${watch.styleNumber} - ${watch.description.substring(0, 50)}...`);

        } catch (error) {
          errorCount++;
          console.error(`  ❌ Error importing ${watch.styleNumber}: ${error.message}`);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('IMPORT SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    console.log(`✅ Successfully imported: ${successCount} watches`);
    console.log(`⏭️  Skipped (already exists): ${skipCount} watches`);
    console.log(`❌ Errors: ${errorCount} watches`);
    console.log(`📊 Total processed: ${successCount + skipCount + errorCount} watches`);
    console.log('\n═══════════════════════════════════════════\n');

    await sequelize.close();
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

importBristonWatches();

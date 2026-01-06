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

// Load the reorganized collections data
const reorganizedData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'roamer-collections-reorganized.json'), 'utf8')
);

function createSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function reorganizeRoamerCollections() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    console.log('═══════════════════════════════════════════');
    console.log('REORGANIZING ROAMER COLLECTIONS');
    console.log('═══════════════════════════════════════════\n');

    // Get Roamer brand
    const [roamerBrand] = await sequelize.query(`
      SELECT id, name FROM watch_brands WHERE LOWER(name) = 'roamer'
    `);

    if (roamerBrand.length === 0) {
      console.error('❌ Roamer brand not found');
      return;
    }

    const brandId = roamerBrand[0].id;

    // STEP 1: Delete old collections and watches
    console.log('STEP 1: Cleaning up old collections\n');

    await sequelize.query(`
      DELETE FROM watches WHERE brand_id = :brand_id
    `, {
      replacements: { brand_id: brandId }
    });

    await sequelize.query(`
      DELETE FROM watch_collections WHERE brand_id = :brand_id
    `, {
      replacements: { brand_id: brandId }
    });

    console.log('✓ Deleted all old Roamer collections and watches\n');

    // STEP 2: Create official collections
    console.log('STEP 2: Creating Official Collections\n');

    const collectionMap = new Map();

    for (const collection of reorganizedData.collections) {
      const slug = createSlug(collection.name);

      const [result] = await sequelize.query(`
        INSERT INTO watch_collections (
          id, brand_id, name, slug, is_featured, is_active, sort_order, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), :brand_id, :name, :slug, false, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id
      `, {
        replacements: {
          brand_id: brandId,
          name: collection.name,
          slug
        }
      });

      const collectionId = result[0].id;
      collectionMap.set(collection.name, collectionId);

      console.log(`  ✓ Created: "${collection.name}" (${collection.count} watches)`);
    }

    console.log(`\n✓ ${reorganizedData.collections.length} collections created\n`);

    // STEP 3: Import watches to new collections
    console.log('STEP 3: Importing Watches\n');

    let successCount = 0;
    let errorCount = 0;

    for (const collection of reorganizedData.collections) {
      const collectionId = collectionMap.get(collection.name);

      if (collection.watches.length === 0) {
        console.log(`  ⊘ ${collection.name} - No watches to import`);
        continue;
      }

      console.log(`  ${collection.name} - Importing ${collection.watches.length} watches`);

      for (const watch of collection.watches) {
        try {
          // Include SKU in slug to ensure uniqueness
          const slug = createSlug(`${watch.description || watch.styleNumber}-${watch.styleNumber}`);
          const baseCost = parseFloat(watch.cost) || 0;
          const rrp = parseFloat(watch.rrp) || 0;

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
              base_price: rrp || baseCost * 2,
              sku: watch.styleNumber,
              technical_specs: JSON.stringify({
                cost: baseCost,
                rrp: rrp
              })
            }
          });

          successCount++;

        } catch (error) {
          errorCount++;
          console.error(`    ❌ Error: ${watch.styleNumber} - ${error.message}`);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('REORGANIZATION SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Collections created: ${reorganizedData.collections.length}`);
    console.log(`Watches imported: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('\n═══════════════════════════════════════════\n');

    await sequelize.close();
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

reorganizeRoamerCollections();

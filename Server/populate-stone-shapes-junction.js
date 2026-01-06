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

async function populateStoneShapesJunction() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    console.log('═══════════════════════════════════════════');
    console.log('POPULATE STONE SHAPES JUNCTION TABLE');
    console.log('═══════════════════════════════════════════\n');

    // Get all products with stone_shape_id
    const [products] = await sequelize.query(`
      SELECT id, sku, name, stone_shape_id
      FROM products
      WHERE stone_shape_id IS NOT NULL
    `);

    console.log(`Found ${products.length} products with stone shapes\n`);

    let successCount = 0;
    let skipCount = 0;

    for (const product of products) {
      try {
        // Check if already exists in junction table
        const [existing] = await sequelize.query(`
          SELECT id FROM product_stone_shapes
          WHERE product_id = :product_id
            AND stone_shape_id = :stone_shape_id
        `, {
          replacements: {
            product_id: product.id,
            stone_shape_id: product.stone_shape_id
          }
        });

        if (existing.length > 0) {
          skipCount++;
          continue;
        }

        // Insert into junction table
        await sequelize.query(`
          INSERT INTO product_stone_shapes (
            product_id,
            stone_shape_id,
            created_at,
            updated_at
          ) VALUES (
            :product_id,
            :stone_shape_id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `, {
          replacements: {
            product_id: product.id,
            stone_shape_id: product.stone_shape_id
          }
        });

        successCount++;

        if (successCount % 20 === 0) {
          console.log(`  ✓ Processed ${successCount} products...`);
        }

      } catch (error) {
        console.error(`  ❌ Error with product ${product.sku}:`, error.message);
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    console.log(`✅ Added to junction table: ${successCount}`);
    console.log(`⏭️  Skipped (already exists): ${skipCount}`);
    console.log(`📊 Total products processed: ${products.length}\n`);

    // Verify
    const [count] = await sequelize.query('SELECT COUNT(*) as count FROM product_stone_shapes');
    console.log(`Total entries in product_stone_shapes table: ${count[0].count}\n`);

    console.log('═══════════════════════════════════════════\n');

    await sequelize.close();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

populateStoneShapesJunction();

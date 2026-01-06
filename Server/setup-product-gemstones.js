require('dotenv').config();
const { Sequelize } = require('sequelize');

async function setupProductGemstones() {
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
    console.log('  SETUP PRODUCT GEMSTONES');
    console.log('='.repeat(70));

    await sequelize.authenticate();
    console.log('\n✓ Database connected');

    // Step 1: Create product_stone_types junction table
    console.log('\n📋 Step 1: Creating product_stone_types table...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS product_stone_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        stone_type_id UUID NOT NULL REFERENCES stone_types(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, stone_type_id)
      )
    `, { type: Sequelize.QueryTypes.RAW });

    console.log('✓ product_stone_types table created');

    // Step 2: Get all stone types
    const stoneTypes = await sequelize.query(`
      SELECT id, name FROM stone_types ORDER BY name
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log(`\n✓ Found ${stoneTypes.length} stone types`);

    // Step 3: Get all active products
    const products = await sequelize.query(`
      SELECT id, name FROM products WHERE is_active = true
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log(`✓ Found ${products.length} active products`);

    // Step 4: Define stone type groups
    const popularStones = ['Natural Diamond', 'Lab Grown Diamond', 'Sapphire', 'Ruby', 'Emerald'];
    const semiPreciousStones = ['Amethyst', 'Aquamarine', 'Morganite', 'Topaz', 'Tanzanite', 'Tourmaline'];
    const specialStones = ['Black Diamond', 'Yellow Diamond', 'Spinel', 'Peridot', 'Zircon'];

    const getRandomStoneTypes = () => {
      const stones = [];
      const numStones = Math.floor(Math.random() * 2) + 1; // 1-2 stones per product

      // Diamonds are most common (80% chance)
      if (Math.random() < 0.8) {
        const diamondType = Math.random() < 0.7 ? 'Natural Diamond' : 'Lab Grown Diamond';
        const stone = stoneTypes.find(st => st.name === diamondType);
        if (stone) stones.push(stone.id);
      }

      // Add a second stone if needed (colored gemstone)
      if (stones.length < numStones && Math.random() < 0.4) {
        const allColoredStones = [...popularStones.filter(s => !s.includes('Diamond')), ...semiPreciousStones];
        const randomStone = allColoredStones[Math.floor(Math.random() * allColoredStones.length)];
        const stone = stoneTypes.find(st => st.name === randomStone);
        if (stone && !stones.includes(stone.id)) {
          stones.push(stone.id);
        }
      }

      return stones;
    };

    console.log('\n🔄 Assigning gemstones to products...\n');

    let assignedCount = 0;

    for (const product of products) {
      const selectedStoneTypeIds = getRandomStoneTypes();

      // Insert into product_stone_types junction table
      for (const stoneTypeId of selectedStoneTypeIds) {
        await sequelize.query(`
          INSERT INTO product_stone_types (product_id, stone_type_id, created_at, updated_at)
          VALUES (:productId, :stoneTypeId, NOW(), NOW())
          ON CONFLICT (product_id, stone_type_id) DO NOTHING
        `, {
          replacements: {
            productId: product.id,
            stoneTypeId: stoneTypeId
          },
          type: Sequelize.QueryTypes.INSERT
        });
      }

      assignedCount++;

      if (assignedCount % 20 === 0) {
        console.log(`  ✓ Processed ${assignedCount}/${products.length} products`);
      }
    }

    console.log(`  ✓ Processed ${products.length}/${products.length} products`);

    // Step 5: Verification
    console.log('\n📊 Verification...');

    const summary = await sequelize.query(`
      SELECT
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT pst.product_id) as products_with_stones,
        COUNT(*) as total_assignments
      FROM products p
      LEFT JOIN product_stone_types pst ON p.id = pst.product_id
      WHERE p.is_active = true
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log(`\n  Total active products: ${summary[0].total_products}`);
    console.log(`  Products with gemstones: ${summary[0].products_with_stones}`);
    console.log(`  Total gemstone assignments: ${summary[0].total_assignments}`);

    // Show distribution by stone type
    console.log('\n📋 Gemstone Distribution:');

    const distribution = await sequelize.query(`
      SELECT
        st.name,
        COUNT(pst.product_id) as product_count
      FROM stone_types st
      LEFT JOIN product_stone_types pst ON st.id = pst.stone_type_id
      GROUP BY st.id, st.name
      ORDER BY product_count DESC, st.name
    `, { type: Sequelize.QueryTypes.SELECT });

    distribution.forEach(d => {
      console.log(`  • ${d.name}: ${d.product_count} products`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ SUCCESS! Gemstones assigned to all products!');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

setupProductGemstones()
  .then(() => {
    console.log('✅ Script completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed!');
    console.error('Error:', error.message);
    process.exit(1);
  });

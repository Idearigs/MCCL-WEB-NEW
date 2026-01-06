require('dotenv').config();
const { Sequelize } = require('sequelize');

async function assignRingStyles() {
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
    console.log('  ASSIGN RING STYLES TO PRODUCTS');
    console.log('='.repeat(70));

    await sequelize.authenticate();
    console.log('\n✓ Database connected');

    // Get all ring types
    const ringTypes = await sequelize.query(`
      SELECT id, name, slug FROM ring_types ORDER BY name
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log(`\n✓ Found ${ringTypes.length} ring types`);

    // Get all active products
    const products = await sequelize.query(`
      SELECT id, name FROM products WHERE is_active = true
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log(`✓ Found ${products.length} active products`);

    // Define common ring style groups
    const popularStyles = ['Solitaire', 'Halo', 'Hidden Halo', 'Trilogy', 'Bezel'];
    const vintageStyles = ['Vintage', 'Bridal Set', 'Shoulder Set'];
    const modernStyles = ['Modern/Contemporary', '2 Stones', '5 Stones'];
    const specialStyles = ['Cross Over', 'Shaped Wedding Band', 'Wed-fit'];

    const getRandomRingTypes = () => {
      const styles = [];
      const numStyles = Math.floor(Math.random() * 2) + 1; // 1-2 styles per product

      // Randomly select from popular styles (70% chance)
      if (Math.random() < 0.7) {
        const randomPopular = popularStyles[Math.floor(Math.random() * popularStyles.length)];
        const ringType = ringTypes.find(rt => rt.name === randomPopular);
        if (ringType) styles.push(ringType.id);
      }

      // Add a second style if needed
      if (styles.length < numStyles && Math.random() < 0.5) {
        const allStyleNames = [...popularStyles, ...vintageStyles, ...modernStyles];
        const randomStyle = allStyleNames[Math.floor(Math.random() * allStyleNames.length)];
        const ringType = ringTypes.find(rt => rt.name === randomStyle);
        if (ringType && !styles.includes(ringType.id)) {
          styles.push(ringType.id);
        }
      }

      return styles;
    };

    console.log('\n🔄 Assigning ring styles to products...\n');

    let assignedCount = 0;

    for (const product of products) {
      const selectedRingTypeIds = getRandomRingTypes();

      // Insert into product_ring_types junction table
      for (const ringTypeId of selectedRingTypeIds) {
        await sequelize.query(`
          INSERT INTO product_ring_types (product_id, ring_type_id, created_at, updated_at)
          VALUES (:productId, :ringTypeId, NOW(), NOW())
          ON CONFLICT (product_id, ring_type_id) DO NOTHING
        `, {
          replacements: {
            productId: product.id,
            ringTypeId: ringTypeId
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

    // Verification
    console.log('\n📊 Verification...');

    const summary = await sequelize.query(`
      SELECT
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT prt.product_id) as products_with_ring_styles,
        COUNT(*) as total_assignments
      FROM products p
      LEFT JOIN product_ring_types prt ON p.id = prt.product_id
      WHERE p.is_active = true
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log(`\n  Total active products: ${summary[0].total_products}`);
    console.log(`  Products with ring styles: ${summary[0].products_with_ring_styles}`);
    console.log(`  Total ring style assignments: ${summary[0].total_assignments}`);

    // Show distribution by ring type
    console.log('\n📋 Ring Style Distribution:');

    const distribution = await sequelize.query(`
      SELECT
        rt.name,
        COUNT(prt.product_id) as product_count
      FROM ring_types rt
      LEFT JOIN product_ring_types prt ON rt.id = prt.ring_type_id
      GROUP BY rt.id, rt.name
      ORDER BY product_count DESC, rt.name
    `, { type: Sequelize.QueryTypes.SELECT });

    distribution.forEach(d => {
      console.log(`  • ${d.name}: ${d.product_count} products`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ SUCCESS! Ring styles assigned to all products!');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

assignRingStyles()
  .then(() => {
    console.log('✅ Script completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed!');
    console.error('Error:', error.message);
    process.exit(1);
  });

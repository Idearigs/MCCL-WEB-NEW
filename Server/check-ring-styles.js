require('dotenv').config();
const { Sequelize } = require('sequelize');

async function checkRingStyles() {
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
    await sequelize.authenticate();
    console.log('\n✓ Connected to database\n');

    // Check if product_ring_types table exists
    const tableExists = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'product_ring_types'
      )
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('product_ring_types table exists:', tableExists[0].exists);

    if (tableExists[0].exists) {
      // Check if products have ring styles assigned
      const productsWithRingStyles = await sequelize.query(`
        SELECT
          p.id,
          p.name,
          COUNT(prt.ring_type_id) as ring_type_count
        FROM products p
        LEFT JOIN product_ring_types prt ON p.id = prt.product_id
        WHERE p.is_active = true
        GROUP BY p.id, p.name
        LIMIT 10
      `, { type: Sequelize.QueryTypes.SELECT });

      console.log('\nSample products with ring type counts:');
      productsWithRingStyles.forEach(p => {
        console.log(`  • ${p.name}: ${p.ring_type_count} ring styles`);
      });

      // Count total products with and without ring styles
      const summary = await sequelize.query(`
        SELECT
          COUNT(DISTINCT p.id) as total_products,
          COUNT(DISTINCT prt.product_id) as products_with_ring_styles
        FROM products p
        LEFT JOIN product_ring_types prt ON p.id = prt.product_id
        WHERE p.is_active = true
      `, { type: Sequelize.QueryTypes.SELECT });

      console.log(`\n📊 Summary:`);
      console.log(`  Total active products: ${summary[0].total_products}`);
      console.log(`  Products with ring styles: ${summary[0].products_with_ring_styles}`);
      console.log(`  Products without ring styles: ${summary[0].total_products - summary[0].products_with_ring_styles}`);
    }

    // Check available ring types
    console.log('\n📋 Available Ring Types:');
    const ringTypes = await sequelize.query(`
      SELECT id, name, slug FROM ring_types ORDER BY name
    `, { type: Sequelize.QueryTypes.SELECT });

    ringTypes.forEach(rt => {
      console.log(`  • ${rt.name} (${rt.slug})`);
    });

    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

checkRingStyles()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

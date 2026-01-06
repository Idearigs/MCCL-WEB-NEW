require('dotenv').config();
const { Sequelize } = require('sequelize');

async function checkGemstones() {
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

    // Check if product_gemstones table exists
    const tableExists = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'product_gemstones'
      )
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('product_gemstones table exists:', tableExists[0].exists);

    if (tableExists[0].exists) {
      // Check if products have gemstones assigned
      const productsWithGemstones = await sequelize.query(`
        SELECT
          p.id,
          p.name,
          COUNT(pg.gemstone_id) as gemstone_count
        FROM products p
        LEFT JOIN product_gemstones pg ON p.id = pg.product_id
        WHERE p.is_active = true
        GROUP BY p.id, p.name
        LIMIT 10
      `, { type: Sequelize.QueryTypes.SELECT });

      console.log('\nSample products with gemstone counts:');
      productsWithGemstones.forEach(p => {
        console.log(`  • ${p.name}: ${p.gemstone_count} gemstones`);
      });

      // Count total products with and without gemstones
      const summary = await sequelize.query(`
        SELECT
          COUNT(DISTINCT p.id) as total_products,
          COUNT(DISTINCT pg.product_id) as products_with_gemstones
        FROM products p
        LEFT JOIN product_gemstones pg ON p.id = pg.product_id
        WHERE p.is_active = true
      `, { type: Sequelize.QueryTypes.SELECT });

      console.log(`\n📊 Summary:`);
      console.log(`  Total active products: ${summary[0].total_products}`);
      console.log(`  Products with gemstones: ${summary[0].products_with_gemstones}`);
      console.log(`  Products without gemstones: ${summary[0].total_products - summary[0].products_with_gemstones}`);
    }

    // Check available gemstones
    console.log('\n📋 Available Gemstones:');
    const gemstones = await sequelize.query(`
      SELECT id, name FROM gemstones ORDER BY name
    `, { type: Sequelize.QueryTypes.SELECT });

    gemstones.forEach(g => {
      console.log(`  • ${g.name}`);
    });

    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

checkGemstones()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

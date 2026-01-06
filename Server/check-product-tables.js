require('dotenv').config();
const { Sequelize } = require('sequelize');

async function checkProductTables() {
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

    // Find all product-related tables
    const tables = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'product_%'
      ORDER BY table_name
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('Product-related tables:');
    tables.forEach(t => {
      console.log(`  • ${t.table_name}`);
    });

    // Check if there's a product_stone_types table
    const hasProductStoneTypes = tables.find(t => t.table_name === 'product_stone_types');

    if (hasProductStoneTypes) {
      console.log('\n📋 product_stone_types table structure:');
      const columns = await sequelize.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'product_stone_types'
        ORDER BY ordinal_position
      `, { type: Sequelize.QueryTypes.SELECT });

      columns.forEach(c => {
        console.log(`  • ${c.column_name} (${c.data_type})`);
      });

      // Check how many products have stone types
      const count = await sequelize.query(`
        SELECT COUNT(DISTINCT product_id) as count
        FROM product_stone_types
      `, { type: Sequelize.QueryTypes.SELECT });

      console.log(`\nProducts with stone types: ${count[0].count}`);
    } else {
      console.log('\n⚠️  product_stone_types table does not exist');
      console.log('   Need to create junction table for product-stone_types relationship');
    }

    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

checkProductTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

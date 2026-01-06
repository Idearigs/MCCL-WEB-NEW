require('dotenv').config();
const { Sequelize } = require('sequelize');

async function checkProductsSchema() {
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
    console.log('\n📡 Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Connected!\n');

    // Check products table schema
    console.log('=== PRODUCTS TABLE SCHEMA ===\n');
    const productsSchema = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('Columns in products table:');
    productsSchema.forEach(col => {
      console.log(`  • ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Check for jewelry-related tables
    console.log('\n=== JEWELRY-RELATED TABLES ===\n');
    const tables = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%jewelry%'
      ORDER BY table_name
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('Jewelry-related tables:');
    tables.forEach(table => {
      console.log(`  • ${table.table_name}`);
    });

    // Check products count
    console.log('\n=== PRODUCTS STATS ===\n');
    const stats = await sequelize.query(`
      SELECT COUNT(*) as total FROM products
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log(`Total products: ${stats[0].total}`);

    // Check ring types table
    console.log('\n=== RING TYPES ===\n');
    const ringTypes = await sequelize.query(`
      SELECT id, name, slug FROM ring_types ORDER BY name
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('Available ring types:');
    ringTypes.forEach(type => {
      console.log(`  • ${type.name} (${type.slug})`);
    });

    // Check if there's a jewelry_sub_types table
    console.log('\n=== JEWELRY SUB TYPES ===\n');
    try {
      const subTypes = await sequelize.query(`
        SELECT id, name, slug FROM jewelry_sub_types ORDER BY name
      `, { type: Sequelize.QueryTypes.SELECT });

      console.log('Available jewelry sub types:');
      subTypes.forEach(type => {
        console.log(`  • ${type.name} (${type.slug})`);
      });
    } catch (error) {
      console.log('⚠️  jewelry_sub_types table does not exist');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkProductsSchema();

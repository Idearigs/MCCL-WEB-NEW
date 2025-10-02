const { Sequelize } = require('sequelize');
const config = require('../config/config');

async function checkTableStructure() {
  const sequelize = new Sequelize(
    config.database.postgres.database,
    config.database.postgres.username,
    config.database.postgres.password,
    {
      host: config.database.postgres.host,
      port: config.database.postgres.port,
      dialect: 'postgres',
      logging: console.log,
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to the database');

    // Check product_metals table structure
    const [productMetalsColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'product_metals';
    `);

    console.log('\n📋 product_metals table structure:');
    console.table(productMetalsColumns);

    // Check if there are any records in product_metals
    const [productMetalsCount] = await sequelize.query('SELECT COUNT(*) as count FROM product_metals');
    console.log(`\n📊 Number of records in product_metals: ${productMetalsCount[0].count}`);

    // Check the junction table between products and metals
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
    `);

    console.log('\n📋 All tables in the database:');
    console.table(tables.map(t => t.table_name));

  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkTableStructure();

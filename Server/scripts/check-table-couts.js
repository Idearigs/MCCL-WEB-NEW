// File: check-table-counts.js
const { Sequelize } = require('sequelize');
const config = require('../config/config');

async function checkTableCounts() {
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
    console.log('✅ Successfully connected to the database\n');

    const tables = [
      'categories', 'collections', 'gemstones', 'ring_types',
      'product_images', 'product_metals', 'product_sizes', 
      'product_variants', 'products', 'admin_users'
    ];

    console.log('📊 Table Record Counts:');
    console.log('----------------------');
    
    for (const table of tables) {
      try {
        const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`📋 ${table.padEnd(20)}: ${result[0].count.toString().padStart(4)} records`);
      } catch (e) {
        console.error(`❌ Error querying ${table}:`, e.message);
      }
    }

    console.log('\n🔍 Checking for sample data...');
    console.log('----------------------');
    
    // Check for sample categories
    const [categories] = await sequelize.query('SELECT id, name FROM categories LIMIT 3');
    console.log('\nSample Categories:');
    console.table(categories);

    // Check for sample products
    const [products] = await sequelize.query('SELECT id, name, sku FROM products LIMIT 3');
    console.log('\nSample Products:');
    console.table(products);

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('\nTroubleshooting Tips:');
    console.log('1. Check if the database server is running');
    console.log('2. Verify your database credentials in the .env file');
    console.log(`3. Ensure your IP (${config.database.postgres.host}) is whitelisted in the database`);
    console.log('4. Check if the database name and port are correct');
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkTableCounts();
const { Sequelize } = require('sequelize');
const config = require('../config/config');

async function listTables() {
  try {
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

    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // List all tables in the database
    const [tables] = await sequelize.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name;`
    );

    console.log('\nTables in the database:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });

    // Check if there are any records in the products table
    const [productCount] = await sequelize.query('SELECT COUNT(*) as count FROM products');
    console.log(`\nProducts table has ${productCount[0].count} records`);

    // Check if there are any records in the items table (if it exists)
    try {
      const [itemCount] = await sequelize.query('SELECT COUNT(*) as count FROM items');
      console.log(`Items table has ${itemCount[0].count} records`);
    } catch (e) {
      console.log('Items table does not exist or cannot be accessed');
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

listTables();

const { Sequelize } = require('sequelize');
const config = require('../config/config');

async function testConnection() {
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
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Test query to get product count
    const [results] = await sequelize.query('SELECT COUNT(*) as product_count FROM products');
    console.log('Total products in database:', results[0].product_count);

    // Get first 5 products
    const [products] = await sequelize.query('SELECT * FROM products LIMIT 5');
    console.log('First 5 products:', JSON.stringify(products, null, 2));

    await sequelize.close();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();

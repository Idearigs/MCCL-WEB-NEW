const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  host: '31.97.116.89',
  port: 5432,
  database: 'mcculloch_db',
  username: 'mcculloch_admin',
  password: '#mcculloch_admin#20026',
  dialect: 'postgres',
  logging: false
});

async function checkExtraWatch() {
  try {
    await sequelize.authenticate();

    // Get watches in "Briston Heritage Collection"
    const [watches] = await sequelize.query(`
      SELECT
        w.id,
        w.name,
        w.sku,
        w.model_number,
        w.created_at,
        c.name as collection_name
      FROM watches w
      JOIN watch_collections c ON w.collection_id = c.id
      WHERE c.name = 'Briston Heritage Collection'
    `);

    console.log('Extra watch found:\n');
    watches.forEach(watch => {
      console.log(`Name: ${watch.name}`);
      console.log(`SKU: ${watch.sku}`);
      console.log(`Model Number: ${watch.model_number}`);
      console.log(`Collection: ${watch.collection_name}`);
      console.log(`Created: ${watch.created_at}`);
      console.log('');
    });

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkExtraWatch();

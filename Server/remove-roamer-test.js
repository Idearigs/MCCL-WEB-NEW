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

async function removeRoamerTest() {
  try {
    await sequelize.authenticate();

    console.log('Removing Roamer test products...\n');

    // Delete test watch "Robber"
    const [deleteWatch] = await sequelize.query(`
      DELETE FROM watches
      WHERE name = 'Robber' OR sku IS NULL
      RETURNING name, sku
    `);

    if (deleteWatch.length > 0) {
      deleteWatch.forEach(w => {
        console.log(`✓ Deleted watch: ${w.name} (SKU: ${w.sku || 'null'})`);
      });
    }

    // Delete test collection "Roamer Swiss Tradition" if it has no watches
    const [checkCollection] = await sequelize.query(`
      SELECT c.id, c.name, COUNT(w.id) as watch_count
      FROM watch_collections c
      LEFT JOIN watches w ON w.collection_id = c.id
      WHERE c.name = 'Roamer Swiss Tradition'
      GROUP BY c.id, c.name
    `);

    if (checkCollection.length > 0 && checkCollection[0].watch_count == 0) {
      await sequelize.query(`
        DELETE FROM watch_collections WHERE name = 'Roamer Swiss Tradition'
      `);
      console.log(`✓ Deleted collection: Roamer Swiss Tradition`);
    }

    console.log('\n✓ Cleanup complete\n');

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

removeRoamerTest();

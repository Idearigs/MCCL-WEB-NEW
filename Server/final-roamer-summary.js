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

async function finalSummary() {
  try {
    await sequelize.authenticate();

    console.log('═══════════════════════════════════════════');
    console.log('ROAMER COLLECTIONS - FINAL SUMMARY');
    console.log('═══════════════════════════════════════════\n');

    const [roamerBrand] = await sequelize.query(`
      SELECT id FROM watch_brands WHERE LOWER(name) = 'roamer'
    `);

    const brandId = roamerBrand[0].id;

    const [collections] = await sequelize.query(`
      SELECT
        c.name as collection_name,
        COUNT(w.id) as watch_count
      FROM watch_collections c
      LEFT JOIN watches w ON w.collection_id = c.id
      WHERE c.brand_id = :brand_id
      GROUP BY c.id, c.name
      ORDER BY c.name
    `, {
      replacements: { brand_id: brandId }
    });

    collections.forEach((collection, index) => {
      const icon = collection.watch_count === 0 ? '⊘' : '✓';
      console.log(`${icon} ${collection.collection_name}: ${collection.watch_count} watches`);
    });

    const totalWatches = collections.reduce((sum, c) => sum + parseInt(c.watch_count), 0);

    console.log('\n═══════════════════════════════════════════');
    console.log(`Total Collections: ${collections.length}`);
    console.log(`Total Watches: ${totalWatches}`);
    console.log(`Collections with 0 watches: ${collections.filter(c => c.watch_count === 0).length}`);
    console.log('═══════════════════════════════════════════\n');

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

finalSummary();

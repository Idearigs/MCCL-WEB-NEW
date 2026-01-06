require('dotenv').config();
const { Sequelize } = require('sequelize');

async function checkBristonSchema() {
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

    // Check watches table schema
    console.log('=== WATCHES TABLE SCHEMA ===\n');
    const watchesSchema = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'watches'
      ORDER BY ordinal_position
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('Columns in watches table:');
    watchesSchema.forEach(col => {
      console.log(`  • ${col.column_name} (${col.data_type})`);
    });

    // Check watch_collections table schema
    console.log('\n=== WATCH_COLLECTIONS TABLE SCHEMA ===\n');
    const collectionsSchema = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'watch_collections'
      ORDER BY ordinal_position
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('Columns in watch_collections table:');
    collectionsSchema.forEach(col => {
      console.log(`  • ${col.column_name} (${col.data_type})`);
    });

    // Get sample watches
    console.log('\n=== SAMPLE WATCHES ===\n');
    const sampleWatches = await sequelize.query(`
      SELECT
        w.id,
        w.model_number,
        w.name,
        wc.name as collection_name,
        wc.brand as collection_brand
      FROM watches w
      LEFT JOIN watch_collections wc ON w.collection_id = wc.id
      LIMIT 10
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('Sample watches:');
    sampleWatches.forEach(watch => {
      console.log(`  • ${watch.model_number || 'N/A'} - ${watch.name} (Collection: ${watch.collection_name || 'None'}, Brand: ${watch.collection_brand || 'N/A'})`);
    });

    // Check current Briston collections
    console.log('\n=== BRISTON COLLECTIONS ===\n');
    const bristonCollections = await sequelize.query(`
      SELECT
        wc.id,
        wc.name,
        wc.slug,
        wc.brand,
        COUNT(w.id) as watch_count
      FROM watch_collections wc
      LEFT JOIN watches w ON w.collection_id = wc.id
      WHERE LOWER(wc.brand) = 'briston'
      GROUP BY wc.id, wc.name, wc.slug, wc.brand
      ORDER BY wc.name
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('Current Briston collections:');
    bristonCollections.forEach(coll => {
      console.log(`  • ${coll.name} (${coll.slug}) - ${coll.watch_count} watches`);
    });

    // Total Briston watches
    console.log('\n=== TOTAL BRISTON WATCHES ===\n');
    const totalBriston = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM watches w
      JOIN watch_collections wc ON w.collection_id = wc.id
      WHERE LOWER(wc.brand) = 'briston'
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log(`Total Briston watches: ${totalBriston[0].count}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkBristonSchema();

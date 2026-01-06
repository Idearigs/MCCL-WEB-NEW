require('dotenv').config();
const { Sequelize } = require('sequelize');

async function findGemstoneTables() {
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

    // Find all tables related to stones/gems
    const tables = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND (
        table_name LIKE '%stone%'
        OR table_name LIKE '%gem%'
      )
      ORDER BY table_name
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('Tables related to stones/gems:');
    tables.forEach(t => {
      console.log(`  • ${t.table_name}`);
    });

    // Check product_gemstones specifically
    if (tables.find(t => t.table_name === 'product_gemstones')) {
      console.log('\n📋 product_gemstones table structure:');
      const columns = await sequelize.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'product_gemstones'
        ORDER BY ordinal_position
      `, { type: Sequelize.QueryTypes.SELECT });

      columns.forEach(c => {
        console.log(`  • ${c.column_name} (${c.data_type})`);
      });
    }

    // Check stone_types table
    if (tables.find(t => t.table_name === 'stone_types')) {
      console.log('\n📋 stone_types data:');
      const stoneTypes = await sequelize.query(`
        SELECT id, name FROM stone_types ORDER BY name LIMIT 20
      `, { type: Sequelize.QueryTypes.SELECT });

      stoneTypes.forEach(st => {
        console.log(`  • ${st.name}`);
      });
    }

    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

findGemstoneTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

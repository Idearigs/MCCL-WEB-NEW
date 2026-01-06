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

async function checkVideoTableStructure() {
  try {
    await sequelize.authenticate();

    // Check product_videos table structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'product_videos'
      ORDER BY ordinal_position
    `);

    console.log('═══════════════════════════════════════════');
    console.log('PRODUCT_VIDEOS TABLE STRUCTURE');
    console.log('═══════════════════════════════════════════\n');

    columns.forEach(col => {
      console.log(`${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('');

    // Check if there are any existing records
    const [count] = await sequelize.query('SELECT COUNT(*) as total FROM product_videos');
    console.log(`Existing video records: ${count[0].total}\n`);

    // Get sample record if exists
    if (count[0].total > 0) {
      const [sample] = await sequelize.query('SELECT * FROM product_videos LIMIT 1');
      console.log('Sample record:');
      console.log(JSON.stringify(sample[0], null, 2));
      console.log('');
    }

    // Check the relationship - see if there's a product_id column
    const hasProductId = columns.find(c => c.column_name === 'product_id');
    if (hasProductId) {
      console.log('✓ Table has product_id column - videos are linked to products');
    }

    await sequelize.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkVideoTableStructure();

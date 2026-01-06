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

async function addVideoField() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Check if video_url column already exists
    const [columns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'video_url'
    `);

    if (columns.length > 0) {
      console.log('✓ video_url column already exists in products table\n');
    } else {
      console.log('Adding video_url column to products table...\n');

      await sequelize.query(`
        ALTER TABLE products
        ADD COLUMN video_url VARCHAR(500)
      `);

      console.log('✓ video_url column added successfully\n');
    }

    // Verify the column was added
    const [result] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'video_url'
    `);

    if (result.length > 0) {
      console.log('Column details:');
      console.log(`  Name: ${result[0].column_name}`);
      console.log(`  Type: ${result[0].data_type}`);
      console.log(`  Max Length: ${result[0].character_maximum_length}`);
      console.log(`  Nullable: ${result[0].is_nullable}`);
      console.log('');
    }

    await sequelize.close();
    console.log('✓ Done\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addVideoField();

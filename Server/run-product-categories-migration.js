const fs = require('fs');
const path = require('path');
const { connectDatabases } = require('./config/database');

const runMigration = async () => {
  try {
    console.log('Connecting to database...');
    const { sequelize } = await connectDatabases();

    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', 'create-product-categories.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    await sequelize.query(migrationSQL);

    console.log('✅ Product categories migration completed successfully!');
    console.log('Created tables:');
    console.log('- product_ring_types');
    console.log('- product_gemstones');
    console.log('- product_metals');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const runMigration = async () => {
  try {
    console.log('Connecting to database...');

    const sequelize = new Sequelize({
      host: process.env.PG_HOST || 'localhost',
      port: process.env.PG_PORT || 5432,
      database: process.env.PG_DATABASE || 'mcculloch_db',
      username: process.env.PG_USERNAME || 'postgres',
      password: process.env.PG_PASSWORD,
      dialect: 'postgres',
      logging: console.log
    });

    await sequelize.authenticate();
    console.log('✅ Database connected successfully!');

    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', 'add-videos-and-many-to-many.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    await sequelize.query(migrationSQL);

    console.log('✅ Videos and many-to-many migration completed successfully!');
    console.log('Created/Updated tables:');
    console.log('- product_videos');
    console.log('- product_ring_types');
    console.log('- product_gemstones');
    console.log('- product_metals_junction');

    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
const { connectDatabases, postgresDB } = require('./config/database');

async function addNewSpecFields() {
  try {
    console.log('Connecting to database...');
    await connectDatabases();

    console.log('Adding new watch specification fields...');

    const db = postgresDB();
    if (!db) {
      throw new Error('Database connection failed.');
    }

    await db.query(`
      ALTER TABLE watch_specifications
      ADD COLUMN IF NOT EXISTS dial TEXT,
      ADD COLUMN IF NOT EXISTS functions TEXT,
      ADD COLUMN IF NOT EXISTS features TEXT,
      ADD COLUMN IF NOT EXISTS movement_type VARCHAR(100),
      ADD COLUMN IF NOT EXISTS glass_type VARCHAR(100),
      ADD COLUMN IF NOT EXISTS battery_life VARCHAR(100),
      ADD COLUMN IF NOT EXISTS antimagnetic_protection VARCHAR(100),
      ADD COLUMN IF NOT EXISTS shock_resistance VARCHAR(100),
      ADD COLUMN IF NOT EXISTS luminosity VARCHAR(100),
      ADD COLUMN IF NOT EXISTS movement_accuracy VARCHAR(100);
    `);

    console.log('✓ Successfully added new specification fields to database');
    process.exit(0);
  } catch (error) {
    console.error('Error adding columns:', error.message);
    process.exit(1);
  }
}

addNewSpecFields();

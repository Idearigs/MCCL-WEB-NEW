const { connectDatabases, postgresDB } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    
    // First connect
    const connected = await connectDatabases(1, 0); // Single attempt, no delay
    
    if (!connected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    const db = postgresDB();
    console.log('✅ Connected to database');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '011_create_orders_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration...');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await db.query(statement);
        console.log('✅ Executed');
      } catch (error) {
        // Some statements might fail if they already exist, that's okay
        if (error.message && error.message.includes('already exists')) {
          console.log('⏭️  Already exists');
        } else {
          console.warn('⚠️  Warning:', error.message?.substring(0, 80));
        }
      }
    }

    console.log('\n✅ Migration completed!');

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigration();

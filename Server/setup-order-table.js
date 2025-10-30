const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupOrderTable() {
  const sequelize = new Sequelize({
    host: process.env.PG_HOST || '31.97.116.89',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'mcculloch_db',
    username: process.env.PG_USERNAME || 'mcculloch_admin',
    password: process.env.PG_PASSWORD,
    dialect: 'postgres',
    logging: false
  });

  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected successfully\n');

    console.log('📝 Creating order_items table...\n');

    const sqlPath = path.join(__dirname, 'migrations', 'create-order-items-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split statements and execute
    const statements = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await sequelize.query(stmt);
        console.log(`✅ Step ${i + 1}/${statements.length} completed`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`⏭️  Step ${i + 1}/${statements.length} - Already exists`);
        } else {
          console.warn(`⚠️  Step ${i + 1}/${statements.length}:`, err.message);
        }
      }
    }

    // Verify
    console.log('\n✅ Verifying tables...\n');
    const [ordersResult] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'orders' AND table_schema = 'public'
      );
    `);
    console.log('✅ Orders table exists:', ordersResult[0].exists);

    const [itemsResult] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'order_items' AND table_schema = 'public'
      );
    `);
    console.log('✅ Order Items table exists:', itemsResult[0].exists);

    console.log('\n🎉 Setup complete! You can now process payments.\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupOrderTable();

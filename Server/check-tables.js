const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkTables() {
  const db = new Sequelize({
    host: process.env.PG_HOST || '31.97.116.89',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'mcculloch_db',
    username: process.env.PG_USERNAME || 'mcculloch_admin',
    password: process.env.PG_PASSWORD,
    dialect: 'postgres',
    logging: false
  });

  try {
    await db.authenticate();
    console.log('Connected to database\n');

    // Get all tables
    const [tables] = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('Tables in public schema:');
    tables.forEach(t => console.log('  -', t.table_name));

    // Check for order tables specifically
    console.log('\nOrder-related tables:');
    const orderTables = tables.filter(t => t.table_name.includes('order'));
    if (orderTables.length === 0) {
      console.log('  ❌ No order tables found');
    } else {
      orderTables.forEach(t => console.log('  ✅', t.table_name));
    }

    // Try to describe order_items if it exists
    const [orderItemsCheck] = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'order_items'
      );
    `);

    console.log('\norder_items table exists:', orderItemsCheck[0].exists);

    if (orderItemsCheck[0].exists) {
      const [columns] = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'order_items'
        ORDER BY ordinal_position;
      `);
      console.log('\norder_items columns:');
      columns.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));
    }

    await db.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTables();

const { postgresDB } = require('./config/database');

async function checkOrderTables() {
  try {
    const db = postgresDB();
    
    if (!db) {
      console.log('❌ Database not connected');
      process.exit(1);
    }

    // Check if orders table exists
    const ordersResult = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'orders'
      );
    `);

    console.log('Orders table exists:', ordersResult[0][0].exists);

    // Check if order_items table exists
    const itemsResult = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'order_items'
      );
    `);

    console.log('Order Items table exists:', itemsResult[0][0].exists);

    // Check table structure
    if (ordersResult[0][0].exists) {
      const columns = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'orders'
        ORDER BY ordinal_position;
      `);
      console.log('\nOrders table columns:');
      columns[0].forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

    // Try to initialize models
    console.log('\nTrying to initialize models...');
    const { initializeModels } = require('./models');
    await require('./config/database').connectDatabases();
    initializeModels();
    console.log('✅ Models initialized successfully');

    const { getModels } = require('./models');
    const models = getModels();
    console.log('\nAvailable models:');
    console.log('  - Order:', !!models.Order);
    console.log('  - OrderItem:', !!models.OrderItem);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkOrderTables();

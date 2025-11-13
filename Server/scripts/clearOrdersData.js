/**
 * Script to clear all orders and order items from the database
 * This is used when implementing new order ID system
 * Run: node scripts/clearOrdersData.js
 */

require('dotenv').config();

const { connectDatabases, closeDatabases } = require('../config/database');
const { getModels } = require('../models');

async function clearOrdersData() {
  try {
    console.log('Connecting to database...');
    const connected = await connectDatabases();

    if (!connected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    const { OrderItem, Order } = getModels();

    if (!OrderItem || !Order) {
      console.error('Models not initialized');
      process.exit(1);
    }

    console.log('Starting database cleanup...');
    console.log('Clearing order_items table...');

    // Delete all order items first (due to foreign key constraint)
    const deletedItems = await OrderItem.destroy({
      where: {},
      force: true
    });
    console.log(`✓ Deleted ${deletedItems} order items`);

    console.log('Clearing orders table...');

    // Delete all orders
    const deletedOrders = await Order.destroy({
      where: {},
      force: true
    });
    console.log(`✓ Deleted ${deletedOrders} orders`);

    console.log('\n✓ Database cleanup complete!');
    console.log('Orders and order items have been cleared.');
    console.log('The system is now ready for new orders with the updated order ID format.\n');

    await closeDatabases();
    process.exit(0);
  } catch (error) {
    console.error('Error clearing orders data:', error);
    await closeDatabases();
    process.exit(1);
  }
}

// Run the cleanup
clearOrdersData();

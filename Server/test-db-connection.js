require('dotenv').config({ path: '.env.production' });
const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');

// Test PostgreSQL Connection
async function testPostgreSQL() {
  console.log('🔍 Testing PostgreSQL connection...');
  console.log(`Host: ${process.env.PG_HOST}:${process.env.PG_PORT}`);
  console.log(`Database: ${process.env.PG_DATABASE}`);
  console.log(`Username: ${process.env.PG_USERNAME}`);
  console.log(`Password length: ${process.env.PG_PASSWORD?.length || 0}`);
  console.log(`Password type: ${typeof process.env.PG_PASSWORD}`);

  const sequelize = new Sequelize({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    username: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    dialect: 'postgres',
    logging: console.log, // Enable logging to see SQL
    dialectOptions: {
      connectTimeout: 5000
    }
  });

  try {
    console.log('📡 Attempting connection...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection successful!');

    // Test basic query
    const [results] = await sequelize.query('SELECT version();');
    console.log('📊 PostgreSQL version:', results[0].version);

    await sequelize.close();
    return true;
  } catch (error) {
    console.log('❌ PostgreSQL connection failed:');
    console.error('Error details:', error.message);
    console.error('Error code:', error.original?.code);
    return false;
  }
}

// Test MongoDB Connection
async function testMongoDB() {
  console.log('\n🔍 Testing MongoDB connection...');
  console.log(`URI: ${process.env.MONGODB_URI.replace(/%23[^@]*%23/, '%23***%23')}`); // Hide password in logs

  try {
    console.log('📡 Attempting MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });

    console.log('✅ MongoDB connection successful!');

    // Test basic operation - just check if we can access the database
    const db = mongoose.connection.db;
    console.log('📊 MongoDB database name:', db.databaseName);

    // Try to list collections instead of serverStatus (requires less permissions)
    try {
      const collections = await db.listCollections().toArray();
      console.log('📊 Collections found:', collections.length);
    } catch (permError) {
      console.log('📊 Basic connection works, but limited permissions (expected for user accounts)');
    }

    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:');
    console.error('Error details:', error.message);
    console.error('Error name:', error.name);
    if (error.cause) {
      console.error('Error cause:', error.cause.message);
    }
    return false;
  }
}

// Run both tests
async function runTests() {
  console.log('🚀 Starting database connection tests...\n');

  const pgResult = await testPostgreSQL();
  const mongoResult = await testMongoDB();

  console.log('\n📋 Test Results:');
  console.log(`PostgreSQL: ${pgResult ? '✅ Success' : '❌ Failed'}`);
  console.log(`MongoDB: ${mongoResult ? '✅ Success' : '❌ Failed'}`);

  if (pgResult && mongoResult) {
    console.log('\n🎉 All database connections are working!');
  } else {
    console.log('\n⚠️  Some database connections failed. Check the errors above.');
  }

  process.exit(0);
}

runTests().catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});
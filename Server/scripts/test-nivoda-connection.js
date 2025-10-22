/**
 * Test Nivoda API Connection
 *
 * This script tests the connection to the Nivoda API and verifies credentials.
 * Run this after setting up your NIVODA_API_KEY and NIVODA_API_SECRET in .env
 *
 * Usage: node scripts/test-nivoda-connection.js
 */

require('dotenv').config();
const nivodaService = require('../services/nivodaService');

async function testNivodaConnection() {
  console.log('\n========================================');
  console.log('Nivoda API Connection Test');
  console.log('========================================\n');

  try {
    // Check if credentials are configured
    console.log('1. Checking if Nivoda credentials are configured...');
    if (!nivodaService.isConfigured()) {
      console.error('❌ FAILED: Nivoda API credentials are not configured.');
      console.log('\nPlease add the following to your .env file:');
      console.log('NIVODA_API_KEY=your_api_key_here');
      console.log('NIVODA_API_SECRET=your_api_secret_here\n');
      process.exit(1);
    }
    console.log('✅ Credentials are configured\n');

    // Test authentication
    console.log('2. Testing authentication with Nivoda API...');
    const token = await nivodaService.authenticate();
    console.log('✅ Authentication successful');
    console.log(`   Token received: ${token.substring(0, 20)}...\n`);

    // Test search functionality
    console.log('3. Testing diamond search...');
    const diamonds = await nivodaService.searchDiamonds({
      stoneType: 'natural',
      caratFrom: 0.5,
      caratTo: 1.0,
      clarity: ['VS1', 'VS2'],
      color: ['F', 'G'],
      cut: ['EX'],
      shapes: ['round']
    });

    if (diamonds && diamonds.length > 0) {
      console.log(`✅ Search successful - Found ${diamonds.length} diamonds`);
      console.log('\n   Sample diamond:');
      console.log(`   - ID: ${diamonds[0].id}`);
      console.log(`   - Carat: ${diamonds[0].diamond.carat}`);
      console.log(`   - Color: ${diamonds[0].diamond.color}`);
      console.log(`   - Clarity: ${diamonds[0].diamond.clarity}`);
      console.log(`   - Cut: ${diamonds[0].diamond.cut}`);
      console.log(`   - Price: ${diamonds[0].total_sales_price} ${diamonds[0].currency || 'USD'}`);
      console.log(`   - Certificate: ${diamonds[0].diamond.certificate?.lab || 'N/A'}`);
    } else {
      console.log('⚠️  Search completed but no diamonds found for the test criteria');
    }
    console.log('');

    // Test metal prices (optional - may not be supported)
    console.log('4. Testing metal prices (optional)...');
    const metalPrices = await nivodaService.getMetalPrices();
    if (metalPrices) {
      console.log('✅ Metal prices retrieved successfully');
      console.log(`   - Gold: ${metalPrices.gold?.price_per_gram} ${metalPrices.gold?.currency}/gram`);
      console.log(`   - Platinum: ${metalPrices.platinum?.price_per_gram} ${metalPrices.platinum?.currency}/gram`);
    } else {
      console.log('ℹ️  Metal prices not supported or not available');
    }
    console.log('');

    console.log('========================================');
    console.log('✅ All tests passed successfully!');
    console.log('========================================\n');
    console.log('Your Nivoda integration is ready to use.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ Test failed with error:');
    console.error('========================================');
    console.error(error.message);
    console.error('\nFull error:', error);
    console.error('\n');
    process.exit(1);
  }
}

// Run the test
testNivodaConnection();

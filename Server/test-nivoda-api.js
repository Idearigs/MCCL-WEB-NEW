/**
 * Test script for Nivoda API integration
 * Tests all Nivoda endpoints to verify they return real data
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/v1';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAvailableOptions() {
  log('\n=== TEST 1: Available Options Endpoint ===', 'blue');
  try {
    const response = await axios.get(`${API_BASE_URL}/nivoda/available-options`);
    log('✓ Status: 200 OK', 'green');
    log(`✓ Response source: ${response.data.source}`, 'green');

    if (response.data.data) {
      const data = response.data.data;
      log(`✓ Available carats: ${data.carats?.length || 0} options`, 'green');
      log(`  Sample carats: ${(data.carats || []).slice(0, 3).join(', ')}`, 'yellow');

      log(`✓ Available clarities: ${data.clarities?.length || 0} options`, 'green');
      log(`  Sample clarities: ${(data.clarities || []).slice(0, 3).join(', ')}`, 'yellow');

      log(`✓ Available colours: ${data.colours?.length || 0} options`, 'green');
      log(`  Sample colours: ${(data.colours || []).slice(0, 3).join(', ')}`, 'yellow');

      log(`✓ Available cuts: ${data.cuts?.length || 0} options`, 'green');
      log(`  Sample cuts: ${(data.cuts || []).slice(0, 3).join(', ')}`, 'yellow');

      log(`✓ Available stone types: ${data.stoneTypes?.length || 0} options`, 'green');
      log(`  Stone types: ${(data.stoneTypes || []).join(', ')}`, 'yellow');
    }

    return response.data;
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    if (error.response) {
      log(`✗ Status: ${error.response.status}`, 'red');
      log(`✗ Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return null;
  }
}

async function testDiamondSearch() {
  log('\n=== TEST 2: Diamond Search Endpoint ===', 'blue');
  try {
    const params = {
      minCarat: 0.5,
      maxCarat: 2.0,
      minPrice: 0,
      maxPrice: 50000,
      color: 'D,E,F',
      clarity: 'VS1,VS2,VVS1',
      cut: 'EX,VG',
      limit: 5,
      offset: 0
    };

    log(`Searching with params:`, 'yellow');
    log(`  Carat: ${params.minCarat} - ${params.maxCarat}`, 'yellow');
    log(`  Price: ${params.minPrice} - ${params.maxPrice}`, 'yellow');
    log(`  Colors: ${params.color}`, 'yellow');
    log(`  Clarities: ${params.clarity}`, 'yellow');

    const response = await axios.get(`${API_BASE_URL}/nivoda/diamonds/search`, { params });
    log('✓ Status: 200 OK', 'green');
    log(`✓ Total diamonds found: ${response.data.total || 0}`, 'green');
    log(`✓ Returned in this request: ${response.data.count || 0}`, 'green');

    if (response.data.data?.items && response.data.data.items.length > 0) {
      const diamond = response.data.data.items[0];
      log('\n✓ Sample diamond data:', 'green');
      log(`  ID: ${diamond.id}`, 'yellow');
      if (diamond.diamond) {
        log(`  Carat: ${diamond.diamond.carat}`, 'yellow');
        log(`  Clarity: ${diamond.diamond.clarity}`, 'yellow');
        log(`  Color: ${diamond.diamond.color}`, 'yellow');
        log(`  Cut: ${diamond.diamond.cut}`, 'yellow');
        log(`  Fluorescence: ${diamond.diamond.fluorescence || 'N/A'}`, 'yellow');
        log(`  Polish: ${diamond.diamond.polish || 'N/A'}`, 'yellow');
        log(`  Symmetry: ${diamond.diamond.symmetry || 'N/A'}`, 'yellow');
        log(`  Table: ${diamond.diamond.table || 'N/A'}`, 'yellow');
        log(`  Depth: ${diamond.diamond.depth || 'N/A'}`, 'yellow');
      }
      log(`  Price: £${diamond.price}`, 'yellow');
      if (diamond.certification) {
        log(`  Certification Lab: ${diamond.certification.lab}`, 'yellow');
        log(`  Cert Number: ${diamond.certification.number}`, 'yellow');
      }
    }

    return response.data;
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    if (error.response) {
      log(`✗ Status: ${error.response.status}`, 'red');
      log(`✗ Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return null;
  }
}

async function testPriceSuggestions() {
  log('\n=== TEST 3: Diamond Price Suggestions Endpoint ===', 'blue');
  try {
    const params = {
      carat: '1.0',
      clarity: 'VS1',
      color: 'D',
      cut: 'EX'
    };

    log(`Getting price suggestions for:`, 'yellow');
    log(`  Carat: ${params.carat}`, 'yellow');
    log(`  Clarity: ${params.clarity}`, 'yellow');
    log(`  Color: ${params.color}`, 'yellow');
    log(`  Cut: ${params.cut}`, 'yellow');

    const response = await axios.get(`${API_BASE_URL}/nivoda/diamonds/price-suggestions`, { params });
    log('✓ Status: 200 OK', 'green');

    if (response.data.data) {
      const data = response.data.data;
      log(`✓ Matching diamonds found: ${data.count || 0}`, 'green');

      if (data.prices) {
        log('\n✓ Price range for this specification:', 'green');
        log(`  Min: £${data.prices.min}`, 'yellow');
        log(`  Average: £${data.prices.avg}`, 'yellow');
        log(`  Max: £${data.prices.max}`, 'yellow');
      }
    }

    return response.data;
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    if (error.response) {
      log(`✗ Status: ${error.response.status}`, 'red');
      log(`✗ Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return null;
  }
}

async function testDiamondById(diamondId) {
  log('\n=== TEST 4: Get Diamond By ID ===', 'blue');

  if (!diamondId) {
    log('ℹ Skipping - no diamond ID available from previous tests', 'yellow');
    return null;
  }

  try {
    log(`Fetching diamond ID: ${diamondId}`, 'yellow');
    const response = await axios.get(`${API_BASE_URL}/nivoda/diamonds/${diamondId}`);
    log('✓ Status: 200 OK', 'green');

    if (response.data.data) {
      const diamond = response.data.data;
      log('✓ Diamond details retrieved:', 'green');
      log(`  ID: ${diamond.id}`, 'yellow');
      if (diamond.diamond) {
        log(`  Carat: ${diamond.diamond.carat}`, 'yellow');
        log(`  Clarity: ${diamond.diamond.clarity}`, 'yellow');
        log(`  Color: ${diamond.diamond.color}`, 'yellow');
        log(`  Cut: ${diamond.diamond.cut}`, 'yellow');
      }
      log(`  Price: £${diamond.price}`, 'yellow');
    }

    return response.data;
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    if (error.response) {
      log(`✗ Status: ${error.response.status}`, 'red');
    }
    return null;
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║   NIVODA API INTEGRATION TEST SUITE   ║', 'blue');
  log('╚════════════════════════════════════════╝', 'blue');

  log(`\nAPI Base URL: ${API_BASE_URL}`, 'blue');
  log(`Test started at: ${new Date().toISOString()}`, 'blue');

  // Test 1: Available Options
  const optionsData = await testAvailableOptions();

  // Test 2: Diamond Search
  const searchData = await testDiamondSearch();
  let diamondId = null;
  if (searchData?.data?.items && searchData.data.items.length > 0) {
    diamondId = searchData.data.items[0].id;
  }

  // Test 3: Price Suggestions
  const priceData = await testPriceSuggestions();

  // Test 4: Get by ID
  if (diamondId) {
    await testDiamondById(diamondId);
  }

  // Summary
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║            TEST SUMMARY               ║', 'blue');
  log('╚════════════════════════════════════════╝', 'blue');

  if (optionsData?.source === 'nivoda_api') {
    log('✓ Available Options: Using REAL Nivoda API data', 'green');
  } else if (optionsData?.source === 'fallback') {
    log('⚠ Available Options: Using FALLBACK hardcoded data', 'yellow');
    if (optionsData.error) {
      log(`  Reason: ${optionsData.error}`, 'yellow');
    }
  }

  if (searchData?.count > 0) {
    log('✓ Diamond Search: Successfully returned results', 'green');
  } else {
    log('⚠ Diamond Search: No results returned', 'yellow');
  }

  if (priceData?.data?.count > 0) {
    log('✓ Price Suggestions: Successfully calculated prices', 'green');
  } else {
    log('⚠ Price Suggestions: No matching diamonds found', 'yellow');
  }

  log('\nTest completed at:', 'blue', new Date().toISOString());
}

// Run all tests
runAllTests().catch(error => {
  log(`\n✗ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

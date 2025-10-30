/**
 * End-to-end test for Nivoda options persistence
 * Tests: saving product with nivoda_options_config, fetching it back, and verifying data
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';
const ADMIN_TOKEN = 'test-token'; // Replace with actual admin token if needed

// Test configuration
const testProduct = {
  name: 'Test Diamond Ring with Nivoda Integration',
  description: 'A beautiful diamond ring with dynamic pricing from Nivoda API',
  short_description: 'Diamond ring with Nivoda integration',
  sku: 'TEST-NIVODA-' + Date.now(),
  base_price: '5000',
  sale_price: '4500',
  currency: 'GBP',
  category_id: '1', // Adjust based on your database
  ring_type_ids: [],
  stone_shape_ids: [],
  stone_type_id: '',
  ring_style_1_ids: [],
  ring_style_2_ids: [],
  ring_style_3_ids: [],
  ring_style_4_ids: [],
  ring_style_5_ids: [],
  metal_ids: [],
  is_active: true,
  is_featured: false,
  in_stock: true,
  stock_quantity: '10',
  meta_title: 'Test Diamond Ring',
  meta_description: 'Test product with Nivoda integration',

  // Nivoda Integration Fields
  nivoda_enabled: true,
  show_stone_type: true,
  show_carat: true,
  show_clarity: true,
  show_colour: true,
  show_cut: true,
  show_certificate: false,
  certificate: '',

  // Nivoda Options Configuration
  nivoda_options_config: {
    stoneType: 'natural',
    caratRange: { min: 0.5, max: 2.0 },
    clarityOptions: ['VS1', 'VS2', 'VVS1', 'VVS2'],
    colourOptions: ['D', 'E', 'F', 'G', 'H'],
    cutOptions: ['EX', 'VG', 'G']
  },

  images: [],
  videos: [],
  variants: []
};

async function runTest() {
  let createdProductId = null;

  try {
    console.log('\n=== Testing Nivoda Options Persistence ===\n');

    // 1. Create a product with nivoda_options_config
    console.log('📝 Step 1: Creating product with nivoda_options_config...');
    console.log('Sending:', JSON.stringify(testProduct.nivoda_options_config, null, 2));

    const createResponse = await axios.post(
      `${API_BASE}/admin/products`,
      testProduct,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      }
    );

    if (!createResponse.data.success) {
      throw new Error('Failed to create product: ' + createResponse.data.message);
    }

    createdProductId = createResponse.data.data.id;
    console.log('✅ Product created with ID:', createdProductId);
    console.log('   Returned nivoda_options_config:', createResponse.data.data.nivoda_options_config);

    // 2. Fetch the product back to verify persistence
    console.log('\n📖 Step 2: Fetching product to verify persistence...');

    const fetchResponse = await axios.get(
      `${API_BASE}/admin/products/${createdProductId}`,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      }
    );

    const fetchedProduct = fetchResponse.data.data;
    console.log('✅ Product fetched');
    console.log('   Retrieved nivoda_options_config:', fetchedProduct.nivoda_options_config);

    // 3. Verify the data matches
    console.log('\n🔍 Step 3: Verifying data integrity...');

    const savedConfig = fetchedProduct.nivoda_options_config;
    const originalConfig = testProduct.nivoda_options_config;

    if (!savedConfig) {
      console.log('❌ FAILED: nivoda_options_config is missing!');
      console.log('   Expected:', originalConfig);
      console.log('   Got: undefined');
      return false;
    }

    // Check each field
    const checks = [
      { field: 'stoneType', expected: originalConfig.stoneType, actual: savedConfig.stoneType },
      { field: 'caratRange.min', expected: originalConfig.caratRange.min, actual: savedConfig.caratRange?.min },
      { field: 'caratRange.max', expected: originalConfig.caratRange.max, actual: savedConfig.caratRange?.max },
      { field: 'clarityOptions', expected: JSON.stringify(originalConfig.clarityOptions), actual: JSON.stringify(savedConfig.clarityOptions) },
      { field: 'colourOptions', expected: JSON.stringify(originalConfig.colourOptions), actual: JSON.stringify(savedConfig.colourOptions) },
      { field: 'cutOptions', expected: JSON.stringify(originalConfig.cutOptions), actual: JSON.stringify(savedConfig.cutOptions) }
    ];

    let allPassed = true;
    for (const check of checks) {
      const passed = check.expected === check.actual;
      console.log(`   ${passed ? '✅' : '❌'} ${check.field}`);
      if (!passed) {
        console.log(`      Expected: ${check.expected}`);
        console.log(`      Got:      ${check.actual}`);
        allPassed = false;
      }
    }

    if (!allPassed) {
      return false;
    }

    // 4. Test update
    console.log('\n📝 Step 4: Testing product update with modified nivoda_options_config...');

    const updatedConfig = {
      ...testProduct,
      nivoda_options_config: {
        stoneType: 'lab-grown',
        caratRange: { min: 1.0, max: 3.0 },
        clarityOptions: ['SI1', 'SI2'],
        colourOptions: ['J', 'K'],
        cutOptions: ['F']
      }
    };

    const updateResponse = await axios.put(
      `${API_BASE}/admin/products/${createdProductId}`,
      updatedConfig,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      }
    );

    if (!updateResponse.data.success) {
      throw new Error('Failed to update product: ' + updateResponse.data.message);
    }

    console.log('✅ Product updated');
    console.log('   Updated config:', updateResponse.data.data.nivoda_options_config);

    // 5. Verify the update persisted
    console.log('\n🔍 Step 5: Verifying update persisted...');

    const verifyResponse = await axios.get(
      `${API_BASE}/admin/products/${createdProductId}`,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      }
    );

    const verifiedConfig = verifyResponse.data.data.nivoda_options_config;
    console.log('   Retrieved updated config:', verifiedConfig);

    if (verifiedConfig?.stoneType !== 'lab-grown') {
      console.log('❌ FAILED: Updated config not persisted correctly!');
      console.log('   Expected stoneType: lab-grown');
      console.log('   Got:', verifiedConfig?.stoneType);
      return false;
    }

    console.log('\n🎉 All tests passed!');
    console.log('\n✅ Summary:');
    console.log('   - Product created with nivoda_options_config');
    console.log('   - Data persisted correctly to database');
    console.log('   - Product fetched and data retrieved intact');
    console.log('   - Product updated with new config');
    console.log('   - Updated config persisted correctly');

    return true;

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error('   Message:', error.message);
    if (error.response?.data) {
      console.error('   Response:', error.response.data);
    }
    return false;
  }
}

// Run the test
runTest().then(success => {
  process.exit(success ? 0 : 1);
});

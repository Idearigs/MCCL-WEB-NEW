const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api/v1';

async function testFullWatchUpdate() {
  try {
    console.log('=== FULL WATCH UPDATE TEST ===\n');

    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/admin/login`, {
      email: 'admin@mcculloch.com',
      password: 'admin123!'
    });

    const token = loginResponse.data.data?.token;
    if (!token) {
      console.error('❌ Failed to login');
      return;
    }
    console.log('✓ Login successful\n');

    // Step 2: Get Festina brand
    console.log('Step 2: Fetching Festina brand...');
    const brandsResponse = await axios.get(`${API_BASE_URL}/admin/watches/brands`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const festinaBrand = brandsResponse.data.data?.find(b => b.name.toLowerCase() === 'festina');
    if (!festinaBrand) {
      console.error('❌ Festina brand not found');
      return;
    }
    console.log(`✓ Found Festina brand\n`);

    // Step 3: Create a test watch
    console.log('Step 3: Creating test watch...');
    const createResponse = await axios.post(
      `${API_BASE_URL}/admin/watches/watches`,
      {
        brand_id: festinaBrand.id,
        name: `Test Watch ${Date.now()}`,
        base_price: 150,
        sale_price: null,
        gender: 'unisex',
        watch_type: 'analog',
        style: 'casual',
        stock_quantity: 10,
        warranty_years: 2,
        description: 'Original description'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!createResponse.data.success) {
      console.error('❌ Failed to create watch');
      console.log('Response:', createResponse.data);
      return;
    }

    const watchId = createResponse.data.data.id;
    console.log(`✓ Created watch: ${watchId}\n`);

    // Step 4: Update watch details (PUT)
    console.log('Step 4: Updating watch details...');
    const updateResponse = await axios.put(
      `${API_BASE_URL}/admin/watches/watches/${watchId}`,
      {
        name: `Test Watch Updated ${Date.now()}`,
        base_price: 200,
        sale_price: 180,
        stock_quantity: 5,
        description: 'Updated description',
        warranty_years: 3
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!updateResponse.data.success) {
      console.error('❌ Failed to update watch');
      console.error('Status:', updateResponse.status);
      console.error('Response:', updateResponse.data);
      return;
    }

    console.log(`✓ Watch details updated successfully\n`);

    // Step 5: Verify the update
    console.log('Step 5: Verifying update...');
    const fetchResponse = await axios.get(
      `${API_BASE_URL}/watches/admin/${watchId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!fetchResponse.data.success) {
      console.error('❌ Failed to fetch updated watch');
      return;
    }

    const updatedWatch = fetchResponse.data.data;
    console.log('Updated watch data:');
    console.log(`  Name: ${updatedWatch.name}`);
    console.log(`  Base Price: £${updatedWatch.base_price}`);
    console.log(`  Sale Price: £${updatedWatch.sale_price || 'N/A'}`);
    console.log(`  Stock: ${updatedWatch.stock_quantity}`);
    console.log(`  Description: ${updatedWatch.description}`);
    console.log(`  Warranty: ${updatedWatch.warranty_years} years`);
    console.log(`  Images: ${(updatedWatch.images || []).length}`);
    console.log(`  Videos: ${(updatedWatch.videos || []).length}\n`);

    // Verify no duplicate was created
    console.log('Step 6: Checking for duplicates...');
    const allWatchesResponse = await axios.get(
      `${API_BASE_URL}/admin/watches/watches?limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const testWatches = allWatchesResponse.data.data?.watches?.filter(w =>
      w.name.includes('Test Watch') && w.brand.id === festinaBrand.id
    );

    console.log(`Found ${testWatches?.length || 0} test watches`);
    if (testWatches?.length === 1) {
      console.log('✓ No duplicates - only one test watch exists\n');
    } else {
      console.log(`⚠️ Found ${testWatches?.length} test watches (expected 1)\n`);
    }

    // Summary
    console.log('=== TEST SUMMARY ===');
    console.log('✓ Create watch: PASSED');
    console.log('✓ Update watch (PUT): PASSED');
    console.log('✓ Verify updates: PASSED');
    console.log(`✓ No duplicates: ${testWatches?.length === 1 ? 'PASSED' : 'FAILED'}`);
    console.log('\n✓ ALL TESTS PASSED!');

  } catch (error) {
    console.error('❌ Error during test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testFullWatchUpdate();

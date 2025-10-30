const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api/v1';

async function testWatchUpdate() {
  try {
    console.log('Testing Watch Update Endpoint\n');
    console.log('Step 1: Logging in as admin@mcculloch.com...');

    // Step 1: Login
    const loginResponse = await axios.post(`${API_BASE_URL}/admin/login`, {
      email: 'admin@mcculloch.com',
      password: 'admin123!'
    });

    const token = loginResponse.data.data?.token;
    if (!token) {
      console.error('❌ Failed to get token from login response');
      console.log('Response:', loginResponse.data);
      return;
    }

    console.log(`✓ Login successful\n`);

    // Step 2: Get a brand for creating a test watch
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

    console.log(`✓ Found Festina brand: ${festinaBrand.id}\n`);

    // Step 3: Create a test watch
    console.log('Step 3: Creating a test watch...');
    const createResponse = await axios.post(
      `${API_BASE_URL}/admin/watches/watches`,
      {
        brand_id: festinaBrand.id,
        name: `Test Watch Update ${Date.now()}`,
        base_price: 150,
        sale_price: null,
        gender: 'unisex',
        watch_type: 'analog',
        style: 'casual',
        stock_quantity: 10,
        warranty_years: 2
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
    console.log(`✓ Created watch with ID: ${watchId}\n`);

    // Step 4: Update the watch using PUT
    console.log('Step 4: Updating the watch using PUT...');
    const updateResponse = await axios.put(
      `${API_BASE_URL}/admin/watches/watches/${watchId}`,
      {
        name: `Test Watch Update - UPDATED ${Date.now()}`,
        base_price: 200,
        sale_price: 180,
        stock_quantity: 5,
        description: 'This is an updated description'
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

    console.log(`✓ Watch updated successfully\n`);

    // Step 5: Fetch the updated watch to verify changes
    console.log('Step 5: Fetching updated watch details...');
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
    console.log(`✓ Fetched updated watch\n`);

    // Verify changes
    console.log('=== VERIFICATION ===');
    console.log(`Watch ID: ${updatedWatch.id}`);
    console.log(`Name: ${updatedWatch.name}`);
    console.log(`Base Price: £${updatedWatch.base_price}`);
    console.log(`Sale Price: £${updatedWatch.sale_price || 'N/A'}`);
    console.log(`Stock Quantity: ${updatedWatch.stock_quantity}`);
    console.log(`Description: ${updatedWatch.description || 'N/A'}`);

    if (updatedWatch.base_price === 200 && updatedWatch.sale_price === 180 && updatedWatch.stock_quantity === 5) {
      console.log('\n✓ All updates verified successfully!');
    } else {
      console.log('\n⚠️ Updates may not have been applied correctly');
    }

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

testWatchUpdate();

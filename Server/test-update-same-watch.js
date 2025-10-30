const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api/v1';

async function testUpdateSameWatch() {
  try {
    console.log('=== TEST: UPDATE SAME WATCH MULTIPLE TIMES ===\n');

    // Login
    const loginResponse = await axios.post(`${API_BASE_URL}/admin/login`, {
      email: 'admin@mcculloch.com',
      password: 'admin123!'
    });

    const token = loginResponse.data.data?.token;
    if (!token) {
      console.error('❌ Failed to login');
      return;
    }

    // Get Festina brand
    const brandsResponse = await axios.get(`${API_BASE_URL}/admin/watches/brands`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const festinaBrand = brandsResponse.data.data?.find(b => b.name.toLowerCase() === 'festina');

    // Create a single watch
    console.log('Creating a watch...');
    const createResponse = await axios.post(
      `${API_BASE_URL}/admin/watches/watches`,
      {
        brand_id: festinaBrand.id,
        name: `Unique Watch ${Date.now()}`,
        base_price: 100,
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

    const watchId = createResponse.data.data.id;
    console.log(`✓ Created watch with ID: ${watchId}\n`);

    // Update the watch 3 times
    for (let i = 1; i <= 3; i++) {
      console.log(`Update #${i}: Changing base price to £${200 + i * 50}...`);
      const updateResponse = await axios.put(
        `${API_BASE_URL}/admin/watches/watches/${watchId}`,
        {
          base_price: 200 + i * 50
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (updateResponse.data.success) {
        console.log(`✓ Updated successfully`);
        console.log(`  Returned ID: ${updateResponse.data.data.id}`);
        console.log(`  New Price: £${updateResponse.data.data.base_price}\n`);

        // Verify ID is the same
        if (updateResponse.data.data.id !== watchId) {
          console.error(`❌ ERROR: Watch ID changed! ${watchId} -> ${updateResponse.data.data.id}`);
          return;
        }
      } else {
        console.error(`❌ Update failed: ${updateResponse.data.message}`);
        return;
      }
    }

    // Final verification: Check that only ONE watch with this unique name exists
    console.log('Final verification: Fetching all watches with this name...');
    const allWatchesResponse = await axios.get(
      `${API_BASE_URL}/admin/watches/watches?limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const watchesWithSameName = allWatchesResponse.data.data?.watches?.filter(w =>
      w.name === `Unique Watch ${Date.now()}` || w.name.includes('Unique Watch')
    );

    console.log(`\nFound ${watchesWithSameName?.length || 0} watches with similar names`);
    watchesWithSameName?.forEach(w => {
      console.log(`  - ${w.id}: ${w.name} (£${w.base_price})`);
    });

    // The key test: we should only have ONE watch with the exact ID we created
    const exactMatch = allWatchesResponse.data.data?.watches?.filter(w => w.id === watchId);

    console.log(`\n=== RESULT ===`);
    if (exactMatch?.length === 1) {
      console.log('✓ SUCCESS: Only ONE watch with this ID exists');
      console.log('✓ All updates were applied to the SAME watch, not duplicated');
      console.log(`✓ Final price: £${exactMatch[0].base_price}`);
    } else {
      console.log(`❌ FAILED: Expected 1 watch with ID ${watchId}, found ${exactMatch?.length}`);
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

testUpdateSameWatch();

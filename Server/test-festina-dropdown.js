const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api/v1';

async function testFestinaCollections() {
  try {
    console.log('Testing Festina Collections Endpoint\n');
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

    console.log(`✓ Login successful, token: ${token.substring(0, 20)}...\n`);

    // Step 2: Get Festina brand ID
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
      console.log('Available brands:', brandsResponse.data.data?.map(b => b.name));
      return;
    }

    console.log(`✓ Found Festina brand: ${festinaBrand.id}\n`);

    // Step 3: Fetch collections WITHOUT cache-busting headers (first attempt)
    console.log('Step 3a: Fetching collections WITHOUT cache-busting (baseline)...');
    const collectionsResponse1 = await axios.get(
      `${API_BASE_URL}/admin/watches/brands/${festinaBrand.id}/collections`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`Status: ${collectionsResponse1.status}`);
    console.log(`Found ${collectionsResponse1.data.data?.length || 0} collections`);
    if (collectionsResponse1.data.data?.length > 0) {
      console.log('Collections:');
      collectionsResponse1.data.data.forEach((c, i) => {
        console.log(`  [${i+1}] ${c.name} (${c.id})`);
      });
    }
    console.log();

    // Step 3b: Fetch collections WITH cache-busting headers (second attempt)
    console.log('Step 3b: Fetching collections WITH cache-busting (timestamp + headers)...');
    const collectionsResponse2 = await axios.get(
      `${API_BASE_URL}/admin/watches/brands/${festinaBrand.id}/collections?t=${Date.now()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

    console.log(`Status: ${collectionsResponse2.status}`);
    console.log(`Found ${collectionsResponse2.data.data?.length || 0} collections`);
    if (collectionsResponse2.data.data?.length > 0) {
      console.log('Collections:');
      collectionsResponse2.data.data.forEach((c, i) => {
        console.log(`  [${i+1}] ${c.name} (${c.id})`);
      });
    }
    console.log();

    // Step 3c: Try a third time with explicit fresh fetch
    console.log('Step 3c: Fetching collections third time (verifying consistency)...');
    const collectionsResponse3 = await axios.get(
      `${API_BASE_URL}/admin/watches/brands/${festinaBrand.id}/collections?t=${Date.now() + Math.random()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );

    console.log(`Status: ${collectionsResponse3.status}`);
    console.log(`Found ${collectionsResponse3.data.data?.length || 0} collections`);
    if (collectionsResponse3.data.data?.length > 0) {
      console.log('Collections:');
      collectionsResponse3.data.data.forEach((c, i) => {
        console.log(`  [${i+1}] ${c.name} (${c.id})`);
      });
    }
    console.log();

    // Summary
    console.log('=== SUMMARY ===');
    console.log(`Baseline fetch: ${collectionsResponse1.data.data?.length || 0} collections`);
    console.log(`Cache-bust fetch: ${collectionsResponse2.data.data?.length || 0} collections`);
    console.log(`Third fetch: ${collectionsResponse3.data.data?.length || 0} collections`);

    if (collectionsResponse1.data.data?.length > 0) {
      console.log('\n✓ Endpoint is working and returning data');
    } else {
      console.log('\n❌ Endpoint returned no data - possible database or query issue');
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

testFestinaCollections();

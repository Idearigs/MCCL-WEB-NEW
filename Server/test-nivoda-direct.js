/**
 * Direct test of Nivoda API without server
 * Tests authentication and GraphQL query directly
 */

const axios = require('axios');

const NIVODA_STAGING_URL = 'https://intg-customer-staging.nivodaapi.net/api/diamonds';
const STAGING_EMAIL = 'testaccount@sample.com';
const STAGING_PASSWORD = 'staging-nivoda-22';

async function testAuthentication() {
  console.log('\n=== Testing Nivoda Authentication ===');
  console.log(`URL: ${NIVODA_STAGING_URL}`);
  console.log(`Email: ${STAGING_EMAIL}`);

  try {
    const query = `{authenticate{username_and_password(username:"${STAGING_EMAIL}", password:"${STAGING_PASSWORD}") {token}}}`;

    console.log(`\nSending authentication query...`);
    const response = await axios.post(NIVODA_STAGING_URL, { query });

    if (response.data.errors) {
      console.error('✗ Authentication failed with GraphQL errors:');
      console.error(JSON.stringify(response.data.errors, null, 2));
      return null;
    }

    const token = response.data.data?.authenticate?.username_and_password?.token;
    if (!token) {
      console.error('✗ No token returned in response:');
      console.error(JSON.stringify(response.data, null, 2));
      return null;
    }

    console.log('✓ Authentication successful!');
    console.log(`✓ Token: ${token.substring(0, 20)}...`);
    return token;
  } catch (error) {
    console.error('✗ Authentication request failed:');
    console.error(`  Error: ${error.message}`);
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

async function testDiamondSearch(token) {
  console.log('\n=== Testing Diamond Search Query ===');

  if (!token) {
    console.log('Skipping - no token available');
    return;
  }

  try {
    const query = `query ($token:String!) {
      as(token:$token) {
        diamonds_by_query(
          query: {
            labgrown: false
            color: [D,E,F]
            clarity: [VS1,VS2,VVS1]
            cut: [EX,VG,G]
            sizes: {from: 0.5, to: 2.0}
            dollar_value: {from: 0, to: 50000}
          }
          limit: 5
          offset: 0
        ) {
          items {
            id
            diamond {
              carat
              clarity
              color
              cut
            }
            price
          }
          total_count
        }
      }
    }`;

    console.log('Sending diamond search query...');
    const response = await axios.post(NIVODA_STAGING_URL, {
      query: query,
      variables: { token }
    });

    if (response.data.errors) {
      console.error('✗ Search failed with GraphQL errors:');
      console.error(JSON.stringify(response.data.errors, null, 2));
      return;
    }

    const result = response.data.data?.as?.diamonds_by_query;
    if (!result) {
      console.error('✗ Invalid response structure:');
      console.error(JSON.stringify(response.data, null, 2));
      return;
    }

    console.log('✓ Diamond search successful!');
    console.log(`✓ Total diamonds available: ${result.total_count}`);
    console.log(`✓ Returned in this request: ${result.items?.length || 0}`);

    if (result.items && result.items.length > 0) {
      const diamond = result.items[0];
      console.log('\n✓ Sample diamond:');
      console.log(`  ID: ${diamond.id}`);
      console.log(`  Carat: ${diamond.diamond?.carat}`);
      console.log(`  Clarity: ${diamond.diamond?.clarity}`);
      console.log(`  Color: ${diamond.diamond?.color}`);
      console.log(`  Cut: ${diamond.diamond?.cut}`);
      console.log(`  Price: £${diamond.price}`);
    }
  } catch (error) {
    console.error('✗ Diamond search request failed:');
    console.error(`  Error: ${error.message}`);
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   NIVODA API DIRECT TEST               ║');
  console.log('╚════════════════════════════════════════╝');

  const token = await testAuthentication();
  await testDiamondSearch(token);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

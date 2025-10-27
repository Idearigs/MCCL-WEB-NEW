/**
 * Discover what fields are available on the items response from diamonds_by_query
 */

const axios = require('axios');

const NIVODA_STAGING_URL = 'https://intg-customer-staging.nivodaapi.net/api/diamonds';
const STAGING_EMAIL = 'testaccount@sample.com';
const STAGING_PASSWORD = 'staging-nivoda-22';

async function getToken() {
  const query = `{authenticate{username_and_password(username:"${STAGING_EMAIL}", password:"${STAGING_PASSWORD}") {token}}}`;
  const response = await axios.post(NIVODA_STAGING_URL, { query });
  return response.data.data?.authenticate?.username_and_password?.token;
}

async function discoverItemsFields(token) {
  console.log('\n=== Discovering Items Response Fields ===\n');

  // Try to fetch with extended fields
  const fieldsToTest = [
    'id', 'diamond_id', 'diamondId',
    'inclusions', 'grading',
    'specs', 'specification', 'specifications',
    'image', 'images',
    'price', 'final_price',
    'certification', 'certificate', 'cert',
    'availability', 'stock',
    'supplier',
    'measurements',
    'tradingDesk',
    'gradeJson', 'grades'
  ];

  for (const field of fieldsToTest) {
    const query = `query ($token:String!) {
      as(token:$token) {
        diamonds_by_query(query: { labgrown: false } limit: 1) {
          items {
            ${field}
          }
        }
      }
    }`;

    try {
      const response = await axios.post(NIVODA_STAGING_URL, {
        query: query,
        variables: { token }
      });

      if (!response.data.errors && response.data.data?.as?.diamonds_by_query?.items) {
        const item = response.data.data.as.diamonds_by_query.items[0];
        if (item && item[field] !== undefined && item[field] !== null) {
          console.log(`✓ Field "${field}" found`);
          console.log(`  Value: ${JSON.stringify(item[field]).substring(0, 100)}`);
        }
      } else if (response.data.errors) {
        // Field doesn't exist
        //console.log(`✗ Field "${field}" not available`);
      }
    } catch (error) {
      // Skip on error
    }
  }

  // Now try to get the full items response to see all fields
  console.log('\n=== Full items response ===\n');
  const query = `query ($token:String!) {
    as(token:$token) {
      diamonds_by_query(query: { labgrown: false } limit: 1) {
        items {
          id
          diamond {
            id
            image
            certificate {
              lab
              number
            }
            inclusions {
              carat
              clarity
              color
              cut
              polish
              symmetry
            }
          }
          price
        }
      }
    }
  }`;

  try {
    const response = await axios.post(NIVODA_STAGING_URL, {
      query: query,
      variables: { token }
    });

    if (response.data.errors) {
      console.log('Errors:');
      response.data.errors.forEach(err => {
        console.log(`  - ${err.message.substring(0, 100)}`);
      });
    } else {
      const item = response.data.data?.as?.diamonds_by_query?.items?.[0];
      if (item) {
        console.log('✓ Query successful!');
        console.log(JSON.stringify(item, null, 2));
      }
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   NIVODA ITEMS FIELDS DISCOVERY        ║');
  console.log('╚════════════════════════════════════════╝');

  const token = await getToken();
  console.log(`✓ Got token`);

  await discoverItemsFields(token);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

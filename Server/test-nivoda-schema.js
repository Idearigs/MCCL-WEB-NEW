/**
 * Test to discover Nivoda GraphQL schema fields
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

async function testSimpleQuery(token) {
  console.log('\n=== Testing Simple Diamond Query ===\n');

  const query = `query ($token:String!) {
    as(token:$token) {
      diamonds_by_query(
        query: {
          labgrown: false
        }
        limit: 1
      ) {
        items {
          id
          diamond {
            id
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
      console.error('Errors:', JSON.stringify(response.data.errors, null, 2));
      return;
    }

    const result = response.data.data?.as?.diamonds_by_query?.items?.[0];
    console.log('✓ Basic query works!');
    console.log('\nSample diamond structure:');
    console.log(JSON.stringify(result, null, 2));

    // Now try to access the diamond object
    console.log('\n\nTrying to expand diamond fields...');

    // Try common field names
    const fieldsToTry = [
      'carat', 'carats', 'weight',
      'clarity', 'clarities',
      'color', 'colour',
      'cut', 'cuts',
      'grade', 'grades',
      'fluorescence', 'fluor',
      'polish', 'symmetry', 'table', 'depth',
      'image', 'images', 'imageUrl',
      'certification', 'cert', 'lab_report',
      'report_number', 'certificate_number'
    ];

    for (const field of fieldsToTry) {
      const testQuery = `query ($token:String!) {
        as(token:$token) {
          diamonds_by_query(
            query: { labgrown: false }
            limit: 1
          ) {
            items {
              diamond {
                ${field}
              }
            }
          }
        }
      }`;

      try {
        const testResponse = await axios.post(NIVODA_STAGING_URL, {
          query: testQuery,
          variables: { token }
        });

        if (!testResponse.data.errors) {
          const diamondData = testResponse.data.data?.as?.diamonds_by_query?.items?.[0]?.diamond;
          if (diamondData && Object.keys(diamondData).length > 0 && diamondData[field] !== undefined) {
            console.log(`✓ Field found: "${field}" = ${JSON.stringify(diamondData[field])}`);
          }
        }
      } catch (e) {
        // Silently skip
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function queryWithIntrospection(token) {
  console.log('\n\n=== Using Schema Introspection ===\n');

  const query = `
    {
      __type(name: "Diamond") {
        name
        fields {
          name
          type {
            name
            kind
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(NIVODA_STAGING_URL, { query });

    if (response.data.errors) {
      console.log('Introspection not supported or different approach needed');
      console.log('Errors:', JSON.stringify(response.data.errors, null, 2));
      return;
    }

    const diamondType = response.data.data?.__type;
    if (diamondType) {
      console.log('✓ Diamond Type Fields:');
      diamondType.fields.forEach(field => {
        console.log(`  - ${field.name} (${field.type?.kind})`);
      });
    }
  } catch (error) {
    console.error('Introspection test failed:', error.message);
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   NIVODA SCHEMA DISCOVERY TEST         ║');
  console.log('╚════════════════════════════════════════╝');

  const token = await getToken();
  console.log(`✓ Got token: ${token.substring(0, 30)}...`);

  await testSimpleQuery(token);
  await queryWithIntrospection(token);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

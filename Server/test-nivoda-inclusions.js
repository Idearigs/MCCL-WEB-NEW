/**
 * Test to understand the inclusions field structure
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

async function testInclusions(token) {
  console.log('\n=== Testing inclusions Field ===\n');

  const queries = [
    {
      name: 'Just inclusions object',
      query: `query ($token:String!) {
        as(token:$token) {
          diamonds_by_query(query: { labgrown: false } limit: 1) {
            items {
              diamond {
                inclusions
              }
            }
          }
        }
      }`
    },
    {
      name: 'Inclusions with sub-fields (array)',
      query: `query ($token:String!) {
        as(token:$token) {
          diamonds_by_query(query: { labgrown: false } limit: 1) {
            items {
              diamond {
                inclusions {
                  id
                }
              }
            }
          }
        }
      }`
    },
    {
      name: 'All available fields on diamond',
      query: `query ($token:String!) {
        as(token:$token) {
          diamonds_by_query(query: { labgrown: false } limit: 1) {
            items {
              id
              diamond {
                id
                image
              }
              price
            }
          }
        }
      }`
    }
  ];

  for (const test of queries) {
    console.log(`Testing: ${test.name}`);
    try {
      const response = await axios.post(NIVODA_STAGING_URL, {
        query: test.query,
        variables: { token }
      });

      if (response.data.errors) {
        console.log(`  ✗ Error: ${response.data.errors[0].message.substring(0, 80)}`);
      } else {
        const item = response.data.data?.as?.diamonds_by_query?.items?.[0];
        if (item) {
          console.log(`  ✓ Success`);
          console.log(`    Response: ${JSON.stringify(item).substring(0, 150)}`);
        }
      }
    } catch (error) {
      console.log(`  ✗ Exception: ${error.message}`);
    }
    console.log();
  }

  // Now query the Diamond schema to see inclusions type
  console.log('\n=== Checking Diamond Type Structure ===\n');
  try {
    const query = `
      {
        __type(name: "Diamond") {
          fields {
            name
            type {
              name
              kind
              ofType {
                name
                kind
              }
            }
          }
        }
      }
    `;

    const response = await axios.post(NIVODA_STAGING_URL, { query });

    if (response.data.data?.__type?.fields) {
      const inclusionsField = response.data.data.__type.fields.find(f => f.name === 'inclusions');
      if (inclusionsField) {
        console.log('✓ Found inclusions field:');
        console.log(JSON.stringify(inclusionsField, null, 2));
      } else {
        console.log('inclusions field not found in Diamond type');
        console.log('\nAvailable fields on Diamond:');
        response.data.data.__type.fields
          .slice(0, 10)
          .forEach(f => {
            console.log(`  - ${f.name} (${f.type.kind})`);
          });
      }
    }
  } catch (error) {
    console.log('Could not query schema:', error.message);
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   NIVODA INCLUSIONS FIELD TEST         ║');
  console.log('╚════════════════════════════════════════╝');

  const token = await getToken();
  console.log(`✓ Got token`);

  await testInclusions(token);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

const axios = require('axios');

const NIVODA_STAGING_URL = 'https://intg-customer-staging.nivodaapi.net/api/diamonds';
const NIVODA_PROD_URL = 'https://integrations.nivoda.net/api/diamonds';

// Using STAGING for now - switch to PROD_URL when you have correct production credentials
const NIVODA_API_URL = NIVODA_STAGING_URL;
const STAGING_EMAIL = 'testaccount@sample.com';
const STAGING_PASSWORD = 'staging-nivoda-22';

class NivodaService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
  }

  async authenticate(email = STAGING_EMAIL, password = STAGING_PASSWORD) {
    try {
      const query = `{authenticate{username_and_password(username:"${email}", password:"${password}") {token}}}`;
      const response = await axios.post(NIVODA_API_URL, { query });
      if (response.data.errors) throw new Error(response.data.errors[0].message);
      this.token = response.data.data.authenticate.username_and_password.token;
      this.tokenExpiry = Date.now() + (6 * 60 * 60 * 1000);
      console.log('✅ Nivoda Auth Success');
      return this.token;
    } catch (error) {
      console.error('❌ Nivoda Auth Failed:', error.message);
      throw error;
    }
  }

  async ensureToken(email = STAGING_EMAIL, password = STAGING_PASSWORD) {
    if (!this.token || Date.now() > this.tokenExpiry) {
      await this.authenticate(email, password);
    }
    return this.token;
  }

  async searchDiamonds(filters = {}, email = STAGING_EMAIL, password = STAGING_PASSWORD) {
    try {
      const token = await this.ensureToken(email, password);
      const colorArray = (filters.color && filters.color.length > 0) 
        ? filters.color.map(c => c.toUpperCase()).join(',')
        : 'D,E,F,G,H,I';
      const clarityArray = (filters.clarity && filters.clarity.length > 0)
        ? filters.clarity.map(c => c.toUpperCase()).join(',')
        : 'VS1,VS2,VVS1,VVS2,IF';
      const cutArray = (filters.cut && filters.cut.length > 0)
        ? filters.cut.map(c => c.toUpperCase()).join(',')
        : 'EX,VG,G';

      const query = `query ($token:String!) {
        as(token:$token) {
          diamonds_by_query(
            query: {
              labgrown: false
              color: [${colorArray}]
              clarity: [${clarityArray}]
              cut: [${cutArray}]
              sizes: {from: ${filters.minCarat || 0.5}, to: ${filters.maxCarat || 10}}
              dollar_value: {from: ${filters.minPrice || 0}, to: ${filters.maxPrice || 500000}}
            }
            limit: ${filters.limit || 20}
            offset: ${filters.offset || 0}
          ) {
            items {
              id
              diamond {
                id
                image
              }
              price
            }
            total_count
          }
        }
      }`;

      const response = await axios.post(NIVODA_API_URL, {
        query: query,
        variables: { token }
      });

      if (response.data.errors) {
        console.error('Nivoda GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
        throw new Error(response.data.errors[0].message);
      }
      return response.data.data.as.diamonds_by_query;
    } catch (error) {
      console.error('❌ Diamond Search Failed:', error.message);
      if (error.response && error.response.data) {
        console.error('Nivoda Response:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  async getDiamondById(diamondId, email = STAGING_EMAIL, password = STAGING_PASSWORD) {
    try {
      const token = await this.ensureToken(email, password);
      const query = `query ($token:String!) {
        as(token:$token) {
          get_diamond_by_id(diamond_id: "${diamondId}") {
            id
            diamond {
              id
              image
            }
            price
          }
        }
      }`;

      const response = await axios.post(NIVODA_API_URL, {
        query: query,
        variables: { token }
      });

      if (response.data.errors) throw new Error(response.data.errors[0].message);
      return response.data.data.as.get_diamond_by_id;
    } catch (error) {
      console.error('❌ Get Diamond Failed:', error.message);
      throw error;
    }
  }

  async searchGemstones(filters = {}, email = STAGING_EMAIL, password = STAGING_PASSWORD) {
    try {
      const token = await this.ensureToken(email, password);
      const colorArray = (filters.color && filters.color.length > 0)
        ? filters.color.join('","')
        : 'Red","Pink","Blue","Green","Yellow';

      const query = `query ($token:String!) {
        as(token:$token) {
          gemstones_by_query(
            query: {
              color: ["${colorArray}"]
              sizes: {from: ${filters.minCarat || 0.5}, to: ${filters.maxCarat || 10}}
            }
            limit: ${filters.limit || 20}
          ) {
            items {
              id
              gemstone {
                id
                image
              }
              price
            }
            total_count
          }
        }
      }`;

      const response = await axios.post(NIVODA_API_URL, {
        query: query,
        variables: { token }
      });

      if (response.data.errors) throw new Error(response.data.errors[0].message);
      return response.data.data.as.gemstones_by_query;
    } catch (error) {
      console.error('❌ Gemstone Search Failed:', error.message);
      throw error;
    }
  }
}

module.exports = new NivodaService();

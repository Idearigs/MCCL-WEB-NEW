const axios = require('axios');
const cache = require('./cacheService');

const NIVODA_STAGING_URL = 'https://intg-customer-staging.nivodaapi.net/api/diamonds';
const NIVODA_PROD_URL    = 'https://integrations.nivoda.net/api/diamonds';

const NIVODA_API_URL   = NIVODA_PROD_URL;
const STAGING_EMAIL    = 'has@mccullochjewellers.co.uk';
const STAGING_PASSWORD = '31Ashana';

class NivodaService {
  constructor() {
    this.token       = null;
    this.tokenExpiry = null;
  }

  async authenticate(email = STAGING_EMAIL, password = STAGING_PASSWORD) {
    try {
      const query = `{authenticate{username_and_password(username:"${email}", password:"${password}") {token}}}`;
      const response = await axios.post(NIVODA_API_URL, { query }, { timeout: 15000 });
      if (response.data.errors) throw new Error(response.data.errors[0].message);
      this.token       = response.data.data.authenticate.username_and_password.token;
      this.tokenExpiry = Date.now() + (6 * 60 * 60 * 1000); // 6 hours
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

  /**
   * Search diamonds.
   * Prices returned are in GBP cents (e.g. 295000 = £2,950.00).
   * Divide by 100 in the controller to get pounds.
   */
  async searchDiamonds(filters = {}, email = STAGING_EMAIL, password = STAGING_PASSWORD) {
    // Cache key based on all filter params — 2 hour TTL (prices refresh daily)
    const cacheKey = `nivoda:diamonds:${JSON.stringify(filters)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    try {
      const token = await this.ensureToken(email, password);

      const colorArray   = filters.color?.length   ? filters.color.map(c => c.toUpperCase()).join(',')   : 'D,E,F,G,H,I';
      const clarityArray = filters.clarity?.length  ? filters.clarity.map(c => c.toUpperCase()).join(',') : 'VS1,VS2,VVS1,VVS2,IF';
      const cutArray     = filters.cut?.length      ? filters.cut.map(c => c.toUpperCase()).join(',')     : 'EX,VG,G';

      const minPriceCents = Math.round((filters.minPrice || 0) * 100);
      const maxPriceCents = Math.round((filters.maxPrice || 5000000) * 100);

      const labgrown = filters.labgrown === true ? 'true' : 'false';
      const shapeFilter      = filters.shape?.length      ? `shapes:      ["${filters.shape.toUpperCase().replace(/[\s-]/g, '_')}"]` : '';
      const polishFilter     = filters.polish?.length     ? `polish:      [${filters.polish.map(p => `"${p.toUpperCase()}"`).join(',')}]` : '';
      const symmetryFilter   = filters.symmetry?.length   ? `symmetry:    [${filters.symmetry.map(s => `"${s.toUpperCase()}"`).join(',')}]` : '';
      const fluorFilter      = filters.fluorescence?.length ? `fluorescence: [${filters.fluorescence.map(f => `"${f.toUpperCase()}"`).join(',')}]` : '';
      // lab filter removed — Nivoda deprecated this GraphQL field; filter by certificate client-side

      const query = `query ($token: String!) {
        as(token: $token) {
          diamonds_by_query(
            query: {
              labgrown: ${labgrown}
              color:    [${colorArray}]
              clarity:  [${clarityArray}]
              cut:      [${cutArray}]
              sizes:    { from: ${filters.minCarat || 0.5}, to: ${filters.maxCarat || 10} }
              dollar_value: { from: ${minPriceCents}, to: ${maxPriceCents} }
              ${shapeFilter}
              ${polishFilter}
              ${symmetryFilter}
              ${fluorFilter}
            }
            limit:  ${Math.min(filters.limit || 20, 50)}
            offset: ${filters.offset || 0}
            order:  { type: price, direction: ASC }
          ) {
            items {
              id
              price
              diamond {
                id
                image
                video
                availability
                certificate {
                  id
                  lab
                  shape
                  certNumber
                  carats
                  clarity
                  color
                  cut
                }
              }
            }
            total_count
          }
        }
      }`;

      const response = await axios.post(NIVODA_API_URL, { query, variables: { token } }, { timeout: 30000 });

      if (response.data.errors) {
        console.error('Nivoda GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
        throw new Error(response.data.errors[0].message);
      }

      const result = response.data.data.as.diamonds_by_query;
      await cache.set(cacheKey, result, 2 * 60 * 60); // 2 hours
      return result;
    } catch (error) {
      console.error('❌ Diamond Search Failed:', error.message);
      if (error.response?.data) {
        console.error('Nivoda Response:', JSON.stringify(error.response.data, null, 2));
      }
      // Re-throw with the actual Nivoda error message so it surfaces in the API response
      if (error.response?.data?.errors?.length) {
        const nivodaMsg = error.response.data.errors.map(e => e.message).join('; ');
        throw new Error(`Nivoda: ${nivodaMsg}`);
      }
      throw error;
    }
  }

  async getDiamondById(diamondId, email = STAGING_EMAIL, password = STAGING_PASSWORD) {
    try {
      const token = await this.ensureToken(email, password);
      const query = `query ($token: String!) {
        as(token: $token) {
          get_diamond_by_id(diamond_id: "${diamondId}") {
            id
            price
            diamond {
              id
              image
              video
              availability
              certificate {
                id
                lab
                shape
                certNumber
                carats
                clarity
                color
                cut
              }
            }
          }
        }
      }`;

      const response = await axios.post(NIVODA_API_URL, { query, variables: { token } });
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
      const colorArray = filters.color?.length
        ? filters.color.join('","')
        : 'Red","Pink","Blue","Green","Yellow';

      const query = `query ($token: String!) {
        as(token: $token) {
          gemstones_by_query(
            query: {
              color: ["${colorArray}"]
              sizes: { from: ${filters.minCarat || 0.5}, to: ${filters.maxCarat || 10} }
            }
            limit: ${Math.min(filters.limit || 20, 50)}
          ) {
            items {
              id
              price
              gemstone {
                id
                image
              }
            }
            total_count
          }
        }
      }`;

      const response = await axios.post(NIVODA_API_URL, { query, variables: { token } });
      if (response.data.errors) throw new Error(response.data.errors[0].message);
      return response.data.data.as.gemstones_by_query;
    } catch (error) {
      console.error('❌ Gemstone Search Failed:', error.message);
      throw error;
    }
  }
  // Estimate center stone price from Nivoda by shape + carat.
  // Returns the median GBP price from the cheapest 5 matching diamonds, or null on failure.
  async estimateDiamondPrice(shape, carats, labgrown = false, email = STAGING_EMAIL, password = STAGING_PASSWORD) {
    try {
      const token = await this.ensureToken(email, password);
      const ct = parseFloat(carats) || 0;
      if (ct <= 0) return null;

      const margin = Math.max(ct * 0.08, 0.03);
      const caratMin = parseFloat((ct - margin).toFixed(2));
      const caratMax = parseFloat((ct + margin).toFixed(2));
      const nivodaShape = shape?.toUpperCase().replace(/[\s-]/g, '_') || '';

      const query = `query ($token: String!) {
        as(token: $token) {
          diamonds_by_query(
            query: {
              labgrown: ${labgrown ? 'true' : 'false'}
              sizes: { from: ${caratMin}, to: ${caratMax} }
              ${nivodaShape ? `shapes: ["${nivodaShape}"]` : ''}
              color: [D,E,F,G,H,I]
              clarity: [VS1,VS2,VVS1,VVS2]
              cut: [EX,VG]
            }
            limit: 5
            offset: 0
            order: { type: price, direction: ASC }
          ) {
            items { id price }
          }
        }
      }`;

      const response = await axios.post(NIVODA_API_URL, { query, variables: { token } }, { timeout: 15000 });
      if (response.data.errors) return null;

      const items = response.data.data?.as?.diamonds_by_query?.items || [];
      if (!items.length) return null;

      // Prices from Nivoda are in GBP cents — convert to pounds, return median
      const prices = items.map(d => d.price / 100).sort((a, b) => a - b);
      const mid = Math.floor(prices.length / 2);
      return prices[mid] || prices[0];
    } catch {
      return null;
    }
  }
}

module.exports = new NivodaService();

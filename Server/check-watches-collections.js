const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/v1';

async function checkWatchesInCollections() {
  try {
    console.log('=== CHECKING WATCHES IN COLLECTIONS ===\n');

    // Get all brands
    const brandsResponse = await axios.get(`${API_BASE_URL}/watches/brands`);
    const brands = brandsResponse.data.data;

    for (const brand of brands) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`BRAND: ${brand.name}`);
      console.log('='.repeat(60));

      // Get collections for this brand
      const collectionsResponse = await axios.get(
        `${API_BASE_URL}/watches/brands/${brand.id}/collections`
      );

      const collections = collectionsResponse.data.data || [];

      for (const collection of collections) {
        console.log(`\n📦 Collection: ${collection.name} (${collection.slug})`);

        // Get watches for this specific collection
        try {
          const watchesResponse = await axios.get(
            `${API_BASE_URL}/watches?collection=${collection.slug}&limit=50`
          );

          const watches = watchesResponse.data.data?.watches || [];
          console.log(`   Watches in collection: ${watches.length}`);

          if (watches.length > 0) {
            watches.forEach((watch) => {
              console.log(`   ✓ ${watch.name} (£${watch.base_price})`);
              if (watch.image) {
                console.log(`     Image: ${watch.image.url ? '✓ Yes' : '✗ No'}`);
              }
            });
          } else {
            console.log(`   ⚠️  No watches in this collection`);
          }
        } catch (error) {
          console.error(`   Error fetching watches:`, error.message);
        }
      }
    }

    console.log(`\n${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkWatchesInCollections();

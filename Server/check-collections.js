const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/v1';

async function checkCollections() {
  try {
    console.log('=== CHECKING WATCH COLLECTIONS IN DATABASE ===\n');

    // Get all brands
    console.log('Fetching all brands...');
    const brandsResponse = await axios.get(`${API_BASE_URL}/watches/brands`);

    if (!brandsResponse.data.success) {
      console.error('Failed to fetch brands');
      return;
    }

    const brands = brandsResponse.data.data;
    console.log(`Found ${brands.length} brands\n`);

    // For each brand, get collections
    for (const brand of brands) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`BRAND: ${brand.name} (${brand.slug})`);
      console.log(`ID: ${brand.id}`);
      console.log('='.repeat(60));

      try {
        const collectionsResponse = await axios.get(
          `${API_BASE_URL}/watches/brands/${brand.id}/collections`
        );

        if (collectionsResponse.data.success) {
          const collections = collectionsResponse.data.data;
          console.log(`\nCollections for ${brand.name}: ${collections.length}`);

          if (collections.length > 0) {
            collections.forEach((collection, index) => {
              console.log(`\n  ${index + 1}. ${collection.name}`);
              console.log(`     Slug: ${collection.slug}`);
              console.log(`     ID: ${collection.id}`);
              console.log(`     Featured: ${collection.is_featured}`);
              console.log(`     Description: ${collection.description || 'N/A'}`);
              console.log(`     Image: ${collection.image_url ? '✓ Yes' : '✗ No'}`);
            });
          } else {
            console.log(`  No collections found for ${brand.name}`);
          }
        } else {
          console.error(`Failed to fetch collections for ${brand.name}`);
        }
      } catch (error) {
        console.error(`Error fetching collections for ${brand.name}:`, error.message);
      }
    }

    // Also check for watches and which collections they belong to
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('WATCHES AND THEIR COLLECTIONS');
    console.log('='.repeat(60));

    try {
      const watchesResponse = await axios.get(
        `${API_BASE_URL}/watches?limit=100`
      );

      if (watchesResponse.data.success) {
        const watches = watchesResponse.data.data.watches || [];
        console.log(`\nTotal watches: ${watches.length}\n`);

        watches.forEach((watch) => {
          const collectionName = watch.collection?.name || 'No Collection';
          const brandName = watch.brand?.name || 'Unknown';
          console.log(`- ${watch.name}`);
          console.log(`  Brand: ${brandName}`);
          console.log(`  Collection: ${collectionName}`);
        });
      }
    } catch (error) {
      console.error('Error fetching watches:', error.message);
    }

    console.log(`\n${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCollections();

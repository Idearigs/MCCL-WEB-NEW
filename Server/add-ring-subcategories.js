// Add ring subcategories directly to the database
const { connectDatabases } = require('./config/database');
const { RingType } = require('./models');

const addRingSubcategories = async () => {
  try {
    await connectDatabases();
    console.log('Adding subcategories to rings...');

    // Additional ring subcategories based on the image shown
    const subcategories = [
      { name: 'Three Stone', slug: 'three-stone', description: 'Three stone diamond rings', sort_order: 11 },
      { name: 'Halo', slug: 'halo', description: 'Halo style engagement rings', sort_order: 12 },
      { name: 'Solitaire', slug: 'solitaire', description: 'Classic solitaire rings', sort_order: 13 },
      { name: 'Side Stone', slug: 'side-stone', description: 'Rings with side stones', sort_order: 14 },
      { name: 'Band', slug: 'band', description: 'Wedding and fashion bands', sort_order: 15 },
      { name: 'Eternity', slug: 'eternity', description: 'Eternity rings with continuous stones', sort_order: 16 },
      { name: 'Tennis', slug: 'tennis', description: 'Tennis style rings', sort_order: 17 },
      { name: 'Bypass', slug: 'bypass', description: 'Bypass style rings', sort_order: 18 },
      { name: 'Cluster', slug: 'cluster', description: 'Cluster diamond rings', sort_order: 19 },
      { name: 'Art Deco', slug: 'art-deco', description: 'Art Deco inspired rings', sort_order: 20 }
    ];

    for (const subcategory of subcategories) {
      try {
        const existing = await RingType.findOne({ where: { slug: subcategory.slug } });
        if (!existing) {
          await RingType.create({
            ...subcategory,
            is_active: true
          });
          console.log(`✅ Created: ${subcategory.name}`);
        } else {
          console.log(`⏭️  Skipped: ${subcategory.name} (already exists)`);
        }
      } catch (error) {
        console.error(`❌ Error creating ${subcategory.name}:`, error.message);
      }
    }

    console.log('\n🎉 Ring subcategories addition completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding subcategories:', error.message);
    process.exit(1);
  }
};

addRingSubcategories();
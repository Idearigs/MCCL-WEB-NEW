require('dotenv').config();
const { connectDatabases } = require('../config/database');
const { initializeModels } = require('../models');

const seedComprehensiveCategories = async () => {
  try {
    console.log('🔄 Seeding comprehensive category data...');

    await connectDatabases();
    const models = initializeModels();
    const { Category, RingTypes, Gemstones, ProductMetals, Collection } = models;

    // Clear existing data
    await RingTypes.destroy({ where: {} });
    await Gemstones.destroy({ where: {} });
    await ProductMetals.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await Collection.destroy({ where: {} });

    console.log('✅ Cleared existing data');

    // 1. Main Categories
    const mainCategories = [
      {
        name: 'Rings',
        slug: 'rings',
        description: 'Beautiful engagement rings, wedding bands, and fashion rings',
        is_active: true,
        sort_order: 1
      },
      {
        name: 'Necklaces',
        slug: 'necklaces',
        description: 'Elegant necklaces and pendants',
        is_active: true,
        sort_order: 2
      },
      {
        name: 'Earrings',
        slug: 'earrings',
        description: 'Stunning earrings for every occasion',
        is_active: true,
        sort_order: 3
      },
      {
        name: 'Bracelets',
        slug: 'bracelets',
        description: 'Beautiful bracelets and bangles',
        is_active: true,
        sort_order: 4
      },
      {
        name: 'Watches',
        slug: 'watches',
        description: 'Luxury timepieces',
        is_active: true,
        sort_order: 5
      }
    ];

    const createdCategories = await Category.bulkCreate(mainCategories);
    console.log(`✅ Created ${createdCategories.length} main categories`);

    // 2. Ring Types (from your image)
    const ringTypesData = [
      { name: 'Wedding', slug: 'wedding', description: 'Classic wedding bands', sort_order: 1 },
      { name: 'Engagement', slug: 'engagement', description: 'Beautiful engagement rings', sort_order: 2 },
      { name: 'Vintage', slug: 'vintage', description: 'Vintage style rings', sort_order: 3 },
      { name: 'Promise', slug: 'promise', description: 'Promise rings for special commitments', sort_order: 4 },
      { name: 'Wishbone', slug: 'wishbone', description: 'Wishbone style rings', sort_order: 5 },
      { name: 'Stacking', slug: 'stacking', description: 'Stackable rings', sort_order: 6 },
      { name: 'Cocktail', slug: 'cocktail', description: 'Statement cocktail rings', sort_order: 7 },
      { name: 'Bridal sets', slug: 'bridal-sets', description: 'Complete bridal ring sets', sort_order: 8 },
      { name: 'Men\'s Rings', slug: 'mens-rings', description: 'Rings designed for men', sort_order: 9 },
      { name: 'All Rings', slug: 'all-rings', description: 'Complete ring collection', sort_order: 10 }
    ];

    const createdRingTypes = await RingTypes.bulkCreate(ringTypesData);
    console.log(`✅ Created ${createdRingTypes.length} ring types`);

    // 3. Gemstones (from your image)
    const gemstonesData = [
      {
        name: 'Mined Diamond',
        slug: 'mined-diamond',
        description: 'Natural mined diamonds',
        color: 'Colorless',
        hardness: 10.0,
        price_per_carat: 5000.00,
        sort_order: 1
      },
      {
        name: 'Lab Grown Diamond',
        slug: 'lab-grown-diamond',
        description: 'Laboratory created diamonds',
        color: 'Colorless',
        hardness: 10.0,
        price_per_carat: 2500.00,
        sort_order: 2
      },
      {
        name: 'Sapphire',
        slug: 'sapphire',
        description: 'Beautiful sapphire gemstones',
        color: 'Blue',
        hardness: 9.0,
        price_per_carat: 1500.00,
        sort_order: 3
      },
      {
        name: 'Emerald',
        slug: 'emerald',
        description: 'Stunning emerald gemstones',
        color: 'Green',
        hardness: 7.5,
        price_per_carat: 3000.00,
        sort_order: 4
      },
      {
        name: 'Ruby',
        slug: 'ruby',
        description: 'Precious ruby gemstones',
        color: 'Red',
        hardness: 9.0,
        price_per_carat: 2500.00,
        sort_order: 5
      },
      {
        name: 'Aquamarine',
        slug: 'aquamarine',
        description: 'Light blue aquamarine gems',
        color: 'Light Blue',
        hardness: 7.5,
        price_per_carat: 500.00,
        sort_order: 6
      },
      {
        name: 'Tanzanite',
        slug: 'tanzanite',
        description: 'Rare tanzanite gemstones',
        color: 'Purple-Blue',
        hardness: 6.5,
        price_per_carat: 1200.00,
        sort_order: 7
      },
      {
        name: 'Blue Topaz',
        slug: 'blue-topaz',
        description: 'Beautiful blue topaz gems',
        color: 'Blue',
        hardness: 8.0,
        price_per_carat: 200.00,
        sort_order: 8
      }
    ];

    const createdGemstones = await Gemstones.bulkCreate(gemstonesData);
    console.log(`✅ Created ${createdGemstones.length} gemstones`);

    // 4. Metals (from your image)
    const metalsData = [
      {
        name: 'Yellow Gold',
        color_code: '#FFD700',
        price_multiplier: 1.0000,
        sort_order: 1
      },
      {
        name: 'White Gold',
        color_code: '#F5F5DC',
        price_multiplier: 1.1000,
        sort_order: 2
      },
      {
        name: 'Platinum',
        color_code: '#E5E4E2',
        price_multiplier: 1.5000,
        sort_order: 3
      },
      {
        name: 'Silver',
        color_code: '#C0C0C0',
        price_multiplier: 0.3000,
        sort_order: 4
      },
      {
        name: 'Gold Vermeil',
        color_code: '#FFD700',
        price_multiplier: 0.8000,
        sort_order: 5
      },
      {
        name: 'Rose Gold',
        color_code: '#E8B4B8',
        price_multiplier: 1.0500,
        sort_order: 6
      }
    ];

    const createdMetals = await ProductMetals.bulkCreate(metalsData);
    console.log(`✅ Created ${createdMetals.length} metals`);

    // 5. Collections
    const collectionsData = [
      {
        name: 'Bridal Collection',
        slug: 'bridal-collection',
        description: 'Complete bridal jewelry collection',
        is_active: true,
        is_featured: true,
        sort_order: 1
      },
      {
        name: 'Vintage Collection',
        slug: 'vintage-collection',
        description: 'Vintage inspired jewelry pieces',
        is_active: true,
        is_featured: true,
        sort_order: 2
      },
      {
        name: 'Modern Collection',
        slug: 'modern-collection',
        description: 'Contemporary jewelry designs',
        is_active: true,
        is_featured: true,
        sort_order: 3
      },
      {
        name: 'Diamond Collection',
        slug: 'diamond-collection',
        description: 'Exquisite diamond jewelry',
        is_active: true,
        is_featured: true,
        sort_order: 4
      },
      {
        name: 'Eternity Collection',
        slug: 'eternity-collection',
        description: 'Eternity rings and bands',
        is_active: true,
        is_featured: false,
        sort_order: 5
      }
    ];

    const createdCollections = await Collection.bulkCreate(collectionsData);
    console.log(`✅ Created ${createdCollections.length} collections`);

    // Summary
    console.log('\n🎉 Comprehensive category seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`- Main Categories: ${createdCategories.length}`);
    console.log(`- Ring Types: ${createdRingTypes.length}`);
    console.log(`- Gemstones: ${createdGemstones.length}`);
    console.log(`- Metals: ${createdMetals.length}`);
    console.log(`- Collections: ${createdCollections.length}`);

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
};

module.exports = { seedComprehensiveCategories };

// Run if called directly
if (require.main === module) {
  seedComprehensiveCategories()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}
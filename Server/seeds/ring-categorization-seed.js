const { getModels } = require('../models');

const seedRingCategorization = async () => {
  try {
    const { RingTypes, Gemstones, ProductMetals } = getModels();

    console.log('🔄 Seeding ring categorization data...');

    // Ring Types Data
    const ringTypes = [
      { name: 'Wedding', slug: 'wedding', description: 'Classic wedding rings for commitment and love', sort_order: 1 },
      { name: 'Engagement', slug: 'engagement', description: 'Beautiful engagement rings for proposals', sort_order: 2 },
      { name: 'Vintage', slug: 'vintage', description: 'Vintage-style rings with classic designs', sort_order: 3 },
      { name: 'Solitaire', slug: 'solitaire', description: 'Elegant solitaire rings with single stones', sort_order: 4 },
      { name: 'Three Stone', slug: 'three-stone', description: 'Three stone rings representing past, present, and future', sort_order: 5 },
      { name: 'Halo', slug: 'halo', description: 'Halo rings with surrounding diamonds', sort_order: 6 }
    ];

    // Gemstones Data
    const gemstones = [
      { name: 'Mined Diamond', slug: 'mined-diamond', description: 'Natural mined diamonds', color: 'Colorless', hardness: 10.0, price_per_carat: 5000.00, sort_order: 1 },
      { name: 'Lab Grown Diamond', slug: 'lab-grown-diamond', description: 'Laboratory grown diamonds', color: 'Colorless', hardness: 10.0, price_per_carat: 2000.00, sort_order: 2 },
      { name: 'Sapphire', slug: 'sapphire', description: 'Beautiful sapphire gemstones', color: 'Blue', hardness: 9.0, price_per_carat: 1500.00, sort_order: 3 },
      { name: 'Ruby', slug: 'ruby', description: 'Precious ruby gemstones', color: 'Red', hardness: 9.0, price_per_carat: 2500.00, sort_order: 4 },
      { name: 'Emerald', slug: 'emerald', description: 'Vibrant emerald gemstones', color: 'Green', hardness: 7.5, price_per_carat: 3000.00, sort_order: 5 },
      { name: 'Topaz', slug: 'topaz', description: 'Beautiful topaz gemstones', color: 'Various', hardness: 8.0, price_per_carat: 200.00, sort_order: 6 },
      { name: 'Amethyst', slug: 'amethyst', description: 'Purple amethyst gemstones', color: 'Purple', hardness: 7.0, price_per_carat: 50.00, sort_order: 7 },
      { name: 'Aquamarine', slug: 'aquamarine', description: 'Light blue aquamarine gemstones', color: 'Light Blue', hardness: 7.5, price_per_carat: 300.00, sort_order: 8 }
    ];

    // Metal Types Data
    const metals = [
      { name: 'Yellow Gold', color_code: '#FFD700', price_multiplier: 1.0000, sort_order: 1 },
      { name: 'White Gold', color_code: '#E5E4E2', price_multiplier: 1.1000, sort_order: 2 },
      { name: 'Rose Gold', color_code: '#E8B4B8', price_multiplier: 1.0500, sort_order: 3 },
      { name: 'Platinum', color_code: '#E5E4E2', price_multiplier: 1.5000, sort_order: 4 },
      { name: 'Silver', color_code: '#C0C0C0', price_multiplier: 0.3000, sort_order: 5 },
      { name: 'Titanium', color_code: '#878681', price_multiplier: 0.8000, sort_order: 6 }
    ];

    // Seed Ring Types
    for (const ringType of ringTypes) {
      await RingTypes.findOrCreate({
        where: { slug: ringType.slug },
        defaults: ringType
      });
    }

    // Seed Gemstones
    for (const gemstone of gemstones) {
      await Gemstones.findOrCreate({
        where: { slug: gemstone.slug },
        defaults: gemstone
      });
    }

    // Seed Product Metals
    for (const metal of metals) {
      await ProductMetals.findOrCreate({
        where: { name: metal.name },
        defaults: metal
      });
    }

    console.log('✅ Ring categorization data seeded successfully!');
    console.log(`- Ring Types: ${ringTypes.length} entries`);
    console.log(`- Gemstones: ${gemstones.length} entries`);
    console.log(`- Metals: ${metals.length} entries`);

  } catch (error) {
    console.error('❌ Error seeding ring categorization data:', error);
    throw error;
  }
};

module.exports = { seedRingCategorization };
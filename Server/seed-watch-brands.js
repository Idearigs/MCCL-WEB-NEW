const { postgresDB } = require('./config/database');
const { initializeModels } = require('./models');
const { getWatchModels } = require('./models/watchModels');

const seedWatchBrands = async () => {
  try {
    console.log('Starting to seed watch brands...');

    // Initialize database
    const db = postgresDB();
    await db.authenticate();
    console.log('Database connected successfully');

    // Initialize models
    initializeModels();
    const { initializeWatchModels } = require('./models/watchModels');
    initializeWatchModels();

    const { WatchBrand } = getWatchModels();

    // Define the three brands
    const brands = [
      {
        name: 'Festina',
        slug: 'festina',
        description: 'Festina is a Spanish watch manufacturer founded in 1902. Known for their precision timepieces and innovative designs, Festina combines traditional Swiss watchmaking with contemporary style.',
        website_url: 'https://www.festina.com',
        founded_year: 1902,
        country_origin: 'Spain',
        is_active: true,
        sort_order: 1,
        meta_title: 'Festina Watches - Precision Timepieces',
        meta_description: 'Discover Festina watches, combining Swiss precision with Spanish elegance. Shop luxury timepieces for men and women.'
      },
      {
        name: 'Briston',
        slug: 'briston',
        description: 'Briston is a contemporary watch brand that blends British heritage with modern design. Founded with a vision to create accessible luxury timepieces that celebrate individuality and style.',
        website_url: 'https://www.briston-watches.com',
        founded_year: 2013,
        country_origin: 'United Kingdom',
        is_active: true,
        sort_order: 2,
        meta_title: 'Briston Watches - British Heritage Timepieces',
        meta_description: 'Explore Briston watches featuring British heritage design and modern craftsmanship. Distinctive timepieces for the modern lifestyle.'
      },
      {
        name: 'Roamer',
        slug: 'roamer',
        description: 'Roamer is a Swiss watch manufacturer with a rich heritage dating back to 1888. Known for their robust and reliable timepieces, Roamer combines traditional Swiss craftsmanship with modern innovation.',
        website_url: 'https://www.roamer-watches.com',
        founded_year: 1888,
        country_origin: 'Switzerland',
        is_active: true,
        sort_order: 3,
        meta_title: 'Roamer Swiss Watches - Traditional Craftsmanship',
        meta_description: 'Discover Roamer Swiss watches, featuring traditional craftsmanship and modern innovation. Quality timepieces since 1888.'
      }
    ];

    console.log('Creating watch brands...');

    for (const brandData of brands) {
      // Check if brand already exists
      const existingBrand = await WatchBrand.findOne({
        where: { slug: brandData.slug }
      });

      if (existingBrand) {
        console.log(`✓ Brand "${brandData.name}" already exists, skipping...`);
        continue;
      }

      // Create the brand
      const brand = await WatchBrand.create(brandData);
      console.log(`✓ Created brand: ${brand.name} (ID: ${brand.id})`);
    }

    console.log('\n🎉 Watch brands seeded successfully!');

    // Display summary
    const allBrands = await WatchBrand.findAll({
      attributes: ['id', 'name', 'slug', 'founded_year', 'country_origin'],
      order: [['sort_order', 'ASC']]
    });

    console.log('\n📋 Current watch brands in database:');
    allBrands.forEach(brand => {
      console.log(`- ${brand.name} (${brand.slug}) - Founded ${brand.founded_year} in ${brand.country_origin}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding watch brands:', error);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  seedWatchBrands();
}

module.exports = { seedWatchBrands };
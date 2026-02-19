require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

(async () => {
  try {
    // Initialize database connection first
    const { connectDatabases } = require('../config/database');
    await connectDatabases();

    // Now initialize models
    const { initializeWatchModels, getWatchModels } = require('../models/watchModels');
    initializeWatchModels();
    const { WatchBrand, WatchCollection, Watch, WatchImage, WatchSpecification, WatchVariant } = getWatchModels();

    const { Op } = require('sequelize');

    // Replicate getAllWatches query exactly
    const brand = 'roamer';
    const whereClause = { is_active: true };

    const include = [
      {
        model: WatchBrand,
        as: 'brand',
        attributes: ['id', 'name', 'slug']
      },
      {
        model: WatchCollection,
        as: 'collection',
        attributes: ['id', 'name', 'slug'],
        required: false
      },
      {
        model: WatchImage,
        as: 'images',
        attributes: ['id', 'image_url', 'alt_text', 'is_primary', 'sort_order'],
        order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
      },
      {
        model: WatchSpecification,
        as: 'specifications',
        attributes: ['movement', 'case_material', 'case_diameter', 'water_resistance'],
        required: false
      },
      {
        model: WatchVariant,
        as: 'variants',
        attributes: ['id', 'variant_name', 'price_adjustment', 'size', 'strap_type', 'stock_quantity'],
        where: { is_active: true },
        required: false
      }
    ];

    // Apply brand filter
    include[0].where = { slug: brand };
    include[0].required = true;

    console.log('Testing query: brand=roamer');
    console.log('WatchImage required:', include[2].required, '(undefined = defaults to false for hasMany)');

    const { count, rows: watches } = await Watch.findAndCountAll({
      where: whereClause,
      include,
      order: [['created_at', 'DESC']],
      limit: 12,
      offset: 0,
      distinct: true
    });

    console.log('\nResults:');
    console.log('Count:', count);
    console.log('Rows returned:', watches.length);
    watches.forEach((w, i) => {
      console.log(`  ${i + 1}. ${w.name} - images: ${w.images?.length || 0}`);
    });

  } catch (err) {
    console.error('Error:', err.message);
    if (err.original) console.error('SQL Error:', err.original.message);
  } finally {
    process.exit(0);
  }
})();

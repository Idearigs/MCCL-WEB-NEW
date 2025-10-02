const { getModels } = require('./models');
const { postgresDB } = require('./config/database');

const fixProductRelationships = async () => {
  try {
    console.log('Starting to fix product relationships...');

    // Initialize database
    const db = postgresDB();
    await db.authenticate();
    console.log('Database connected successfully');

    // Initialize models
    const { initializeModels } = require('./models');
    initializeModels();

    const { Product, RingTypes, ProductMetals } = getModels();

    // Get all products
    const products = await Product.findAll();
    console.log(`Found ${products.length} products`);

    // Get available ring types and metals
    const ringTypes = await RingTypes.findAll();
    const metals = await ProductMetals.findAll();

    console.log(`Found ${ringTypes.length} ring types:`, ringTypes.map(rt => rt.name));
    console.log(`Found ${metals.length} metals:`, metals.map(m => m.name));

    if (ringTypes.length === 0 || metals.length === 0) {
      console.log('ERROR: No ring types or metals found in database');
      console.log('You need to add ring types and metals first through the admin interface');
      return;
    }

    let updated = 0;

    // Assign relationships to products that don't have them
    for (const product of products) {
      let productUpdated = false;

      // Assign ring type if not assigned (for rings category)
      if (!product.ring_type_id && product.category_id) {
        // Check if this is a ring product by getting its category
        const productWithCategory = await Product.findByPk(product.id, {
          include: [{
            model: require('./models/Category'),
            as: 'category',
            attributes: ['slug']
          }]
        });

        if (productWithCategory && productWithCategory.category && productWithCategory.category.slug === 'rings') {
          const randomRingType = ringTypes[Math.floor(Math.random() * ringTypes.length)];
          product.ring_type_id = randomRingType.id;
          productUpdated = true;
          console.log(`✓ Assigned ring type "${randomRingType.name}" to ring product "${product.name}"`);
        }
      }

      // Assign metal if not assigned
      if (!product.metal_id) {
        const randomMetal = metals[Math.floor(Math.random() * metals.length)];
        product.metal_id = randomMetal.id;
        productUpdated = true;
        console.log(`✓ Assigned metal "${randomMetal.name}" to product "${product.name}"`);
      }

      if (productUpdated) {
        await product.save();
        updated++;
      }
    }

    console.log(`\n✅ Successfully updated ${updated} products with relationships`);

    // Verify the assignments
    const updatedProducts = await Product.findAll({
      include: [
        {
          model: RingTypes,
          as: 'ringType',
          attributes: ['name'],
          required: false
        },
        {
          model: ProductMetals,
          as: 'metal',
          attributes: ['name'],
          required: false
        }
      ]
    });

    console.log('\n📋 Verification - Product assignments:');
    updatedProducts.forEach(product => {
      console.log(`- ${product.name}:`);
      console.log(`  Ring Type: ${product.ringType ? product.ringType.name : 'None'}`);
      console.log(`  Metal: ${product.metal ? product.metal.name : 'None'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing relationships:', error);
    process.exit(1);
  }
};

fixProductRelationships();
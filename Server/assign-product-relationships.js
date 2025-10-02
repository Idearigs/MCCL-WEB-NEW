const { getModels } = require('./models');
const { postgresDB } = require('./config/database');

const assignProductRelationships = async () => {
  try {
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

    console.log(`Found ${ringTypes.length} ring types and ${metals.length} metals`);

    if (ringTypes.length === 0 || metals.length === 0) {
      console.log('No ring types or metals found in database');
      return;
    }

    // Assign relationships to products that don't have them
    for (const product of products) {
      let updated = false;

      // Assign random ring type if not assigned
      if (!product.ring_type_id) {
        const randomRingType = ringTypes[Math.floor(Math.random() * ringTypes.length)];
        product.ring_type_id = randomRingType.id;
        updated = true;
        console.log(`Assigned ring type "${randomRingType.name}" to product "${product.name}"`);
      }

      // Assign random metal if not assigned
      if (!product.metal_id) {
        const randomMetal = metals[Math.floor(Math.random() * metals.length)];
        product.metal_id = randomMetal.id;
        updated = true;
        console.log(`Assigned metal "${randomMetal.name}" to product "${product.name}"`);
      }

      if (updated) {
        await product.save();
      }
    }

    console.log('Successfully assigned relationships to products');
    process.exit(0);
  } catch (error) {
    console.error('Error assigning relationships:', error);
    process.exit(1);
  }
};

assignProductRelationships();
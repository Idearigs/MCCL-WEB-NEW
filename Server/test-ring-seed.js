require('dotenv').config();
const { connectDatabases } = require('./config/database');
const { initializeModels } = require('./models');
const { seedRingCategorization } = require('./seeds/ring-categorization-seed');

const testRingSeed = async () => {
  try {
    console.log('🔄 Testing ring categorization database setup...');

    // Initialize database connections
    await connectDatabases();
    console.log('✅ Database connections established');

    // Initialize models
    const models = initializeModels();
    console.log('✅ Models initialized');

    // Seed ring categorization data
    await seedRingCategorization();

    // Test data retrieval
    const { RingTypes, Gemstones, ProductMetals } = models;

    const ringTypesCount = await RingTypes.count();
    const gemstonesCount = await Gemstones.count();
    const metalsCount = await ProductMetals.count();

    console.log('📊 Data counts:');
    console.log(`- Ring Types: ${ringTypesCount}`);
    console.log(`- Gemstones: ${gemstonesCount}`);
    console.log(`- Metals: ${metalsCount}`);

    // Test associations
    console.log('🔄 Testing associations...');
    const ringTypes = await RingTypes.findAll({ limit: 3 });
    const gemstones = await Gemstones.findAll({ limit: 3 });
    const metals = await ProductMetals.findAll({ limit: 3 });

    console.log('✅ Ring Types:', ringTypes.map(rt => rt.name));
    console.log('✅ Gemstones:', gemstones.map(g => g.name));
    console.log('✅ Metals:', metals.map(m => m.name));

    console.log('🎉 Ring categorization setup completed successfully!');

  } catch (error) {
    console.error('❌ Error in ring categorization setup:', error);
  } finally {
    process.exit(0);
  }
};

testRingSeed();
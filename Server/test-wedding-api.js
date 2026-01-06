require('dotenv').config();
const express = require('express');
const { postgresDB } = require('./config/database');
const db = require('./models');

const app = express();

async function testWeddingAPI() {
  try {
    console.log('\n🧪 Testing Wedding Rings API...\n');

    // Initialize database and models
    const sequelize = postgresDB();
    await sequelize.authenticate();
    console.log('✓ Database connected');

    db.initializeModels();
    const models = db.getModels();

    console.log('\n📦 Available Models:');
    console.log('  - JewelrySubType:', models.JewelrySubType ? '✓' : '✗');
    console.log('  - Product:', models.Product ? '✓' : '✗');
    console.log('  - Category:', models.Category ? '✓' : '✗');

    if (!models.JewelrySubType) {
      console.error('\n❌ JewelrySubType model is not available!');
      process.exit(1);
    }

    // Test fetching jewelry sub types
    console.log('\n📋 Jewelry Sub Types in Database:');
    const subTypes = await models.JewelrySubType.findAll({
      attributes: ['id', 'name', 'slug']
    });

    subTypes.forEach(type => {
      console.log(`  • ${type.name} (${type.slug})`);
    });

    // Test filtering products by wedding-rings
    console.log('\n🔍 Testing Products Query with jewelrySubType filter...');

    const weddingSubType = subTypes.find(t => t.slug === 'wedding-rings');
    if (!weddingSubType) {
      console.log('⚠️  No wedding-rings sub type found');
      console.log('   This is expected - all products are currently Engagement');
      console.log('   The API should return 0 products, not crash');
    }

    const products = await models.Product.findAll({
      where: { is_active: true },
      include: [
        {
          model: models.JewelrySubType,
          as: 'jewelrySubType',
          attributes: ['id', 'name', 'slug'],
          where: { slug: 'wedding-rings' },
          required: true
        }
      ],
      limit: 5
    });

    console.log(`\n✓ Query executed successfully!`);
    console.log(`  Found ${products.length} wedding ring products`);

    if (products.length === 0) {
      console.log('\n💡 This is expected - no products are currently set to Wedding Rings');
      console.log('   The frontend will show "Coming Soon" message');
    } else {
      console.log('\n✓ Sample wedding ring products:');
      products.forEach(p => {
        console.log(`  • ${p.name} (${p.jewelrySubType?.name})`);
      });
    }

    console.log('\n✅ All tests passed! API should work correctly.\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testWeddingAPI();

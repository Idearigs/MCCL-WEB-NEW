require('dotenv').config();
const { Sequelize } = require('sequelize');

async function updateEngagementRingType() {
  console.log('\n' + '='.repeat(60));
  console.log('   ENGAGEMENT RING TYPE UPDATE SCRIPT');
  console.log('='.repeat(60));

  // Create direct Sequelize connection
  const sequelize = new Sequelize(
    process.env.PG_DATABASE,
    process.env.PG_USERNAME,
    process.env.PG_PASSWORD,
    {
      host: process.env.PG_HOST,
      port: process.env.PG_PORT || 5432,
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        connectTimeout: 60000
      }
    }
  );

  try {
    // Test connection
    console.log('\n📡 Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully!');

    // First, get info about jewelry sub-types (Engagement/Wedding)
    console.log('\n📋 Step 1: Checking Jewelry Categories...');

    const engagementCategory = await sequelize.query(`
      SELECT id, name, slug FROM jewelry_categories
      WHERE category_type = 'sub_type'
      AND (LOWER(name) LIKE '%engagement%' OR LOWER(slug) LIKE '%engagement%')
      LIMIT 1
    `, { type: Sequelize.QueryTypes.SELECT });

    if (engagementCategory.length === 0) {
      console.error('\n❌ No "Engagement" jewelry category found!');
      console.log('Please create an Engagement jewelry category in the admin panel first.');
      process.exit(1);
    }

    const engagementCategoryId = engagementCategory[0].id;
    console.log(`✓ Found Engagement Category: ${engagementCategory[0].name} (ID: ${engagementCategoryId})`);

    // Check current products
    console.log('\n📋 Step 2: Analyzing Current Products...');

    const totalProducts = await sequelize.query(`
      SELECT COUNT(*) as count FROM products
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log(`Total products in database: ${totalProducts[0].count}`);

    const productsWithoutJewelryCategory = await sequelize.query(`
      SELECT COUNT(*) as count FROM products
      WHERE jewelry_category_id IS NULL
    `, { type: Sequelize.QueryTypes.SELECT });

    const countWithout = parseInt(productsWithoutJewelryCategory[0].count);
    console.log(`Products without jewelry_category_id: ${countWithout}`);

    if (countWithout === 0) {
      console.log('\n✓ All products already have jewelry_category_id assigned!');
      console.log('No updates needed.');
      return;
    }

    // Get sample products
    const sampleProducts = await sequelize.query(`
      SELECT p.id, p.name, p.sku, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.jewelry_category_id IS NULL
      LIMIT 10
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('\nSample products to update (first 10):');
    sampleProducts.forEach(product => {
      console.log(`  • ${product.name} (SKU: ${product.sku}) - Category: ${product.category_name || 'N/A'}`);
    });

    console.log(`\n🔄 Step 3: Updating ${countWithout} Products...`);
    console.log(`Setting jewelry_category_id to "Engagement" for all products without a jewelry category...`);

    // Update all products without jewelry_category_id to Engagement
    const updateResult = await sequelize.query(`
      UPDATE products
      SET jewelry_category_id = :engagementCategoryId,
          updated_at = NOW()
      WHERE jewelry_category_id IS NULL
    `, {
      replacements: { engagementCategoryId },
      type: Sequelize.QueryTypes.UPDATE
    });

    console.log(`✓ Successfully updated products!`);

    // Verify the update
    console.log('\n📊 Step 4: Verification...');

    const verificationResults = await sequelize.query(`
      SELECT
        jc.name as jewelry_category,
        COUNT(p.id) as product_count
      FROM products p
      LEFT JOIN jewelry_categories jc ON p.jewelry_category_id = jc.id
      GROUP BY jc.name, jc.id
      ORDER BY product_count DESC
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('\nProducts by Jewelry Category:');
    verificationResults.forEach(result => {
      const categoryName = result.jewelry_category || 'No Category';
      console.log(`  • ${categoryName}: ${result.product_count} products`);
    });

    const stillWithout = await sequelize.query(`
      SELECT COUNT(*) as count FROM products WHERE jewelry_category_id IS NULL
    `, { type: Sequelize.QueryTypes.SELECT });

    const remainingCount = parseInt(stillWithout[0].count);
    console.log(`\nProducts still without jewelry_category_id: ${remainingCount}`);

    if (remainingCount === 0) {
      console.log('\n' + '='.repeat(60));
      console.log('✅ SUCCESS! All products have been updated!');
      console.log('='.repeat(60));
    } else {
      console.log('\n⚠️  Warning: Some products still need manual review.');
    }

  } catch (error) {
    console.error('\n❌ Error updating products:', error);
    console.error('Error details:', error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the update
console.log('\n🚀 Starting Engagement Ring Type Update...\n');

updateEngagementRingType()
  .then(() => {
    console.log('\n✅ Script completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed!');
    console.error('Error:', error.message);
    process.exit(1);
  });

require('dotenv').config();
const { Sequelize } = require('sequelize');

async function addJewelrySubTypeColumn() {
  const sequelize = new Sequelize(
    process.env.PG_DATABASE,
    process.env.PG_USERNAME,
    process.env.PG_PASSWORD,
    {
      host: process.env.PG_HOST,
      port: process.env.PG_PORT || 5432,
      dialect: 'postgres',
      logging: console.log
    }
  );

  try {
    console.log('\n' + '='.repeat(70));
    console.log('  ADD JEWELRY SUB TYPE TO PRODUCTS & UPDATE TO ENGAGEMENT');
    console.log('='.repeat(70));

    console.log('\n📡 Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Connected!\n');

    // Step 1: Check if column already exists
    console.log('📋 Step 1: Checking if jewelry_sub_type_id column exists...');
    const columnCheck = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'products'
      AND column_name = 'jewelry_sub_type_id'
    `, { type: Sequelize.QueryTypes.SELECT });

    if (columnCheck.length > 0) {
      console.log('✓ Column already exists');
    } else {
      console.log('⚠️  Column does not exist, adding it now...');

      // Add the column
      await sequelize.query(`
        ALTER TABLE products
        ADD COLUMN jewelry_sub_type_id UUID REFERENCES jewelry_sub_types(id)
      `);

      console.log('✓ Column jewelry_sub_type_id added successfully');
    }

    // Step 2: Get Engagement Rings jewelry_sub_type
    console.log('\n📋 Step 2: Finding Engagement Rings jewelry sub type...');
    const engagementType = await sequelize.query(`
      SELECT id, name, slug
      FROM jewelry_sub_types
      WHERE LOWER(name) LIKE '%engagement%' OR LOWER(slug) LIKE '%engagement%'
      LIMIT 1
    `, { type: Sequelize.QueryTypes.SELECT });

    if (engagementType.length === 0) {
      console.error('\n❌ No Engagement jewelry sub type found!');
      console.log('Please create an Engagement jewelry sub type first.');
      process.exit(1);
    }

    const engagementId = engagementType[0].id;
    console.log(`✓ Found: ${engagementType[0].name} (ID: ${engagementId})`);

    // Step 3: Check how many products need updating
    console.log('\n📋 Step 3: Analyzing products...');
    const stats = await sequelize.query(`
      SELECT
        COUNT(*) FILTER (WHERE jewelry_sub_type_id IS NULL) as without_subtype,
        COUNT(*) FILTER (WHERE jewelry_sub_type_id = :engagementId) as already_engagement,
        COUNT(*) as total
      FROM products
    `, {
      replacements: { engagementId },
      type: Sequelize.QueryTypes.SELECT
    });

    const needsUpdate = parseInt(stats[0].without_subtype);
    const alreadyEngagement = parseInt(stats[0].already_engagement);
    const total = parseInt(stats[0].total);

    console.log(`Total products: ${total}`);
    console.log(`Already set to Engagement: ${alreadyEngagement}`);
    console.log(`Need to be updated: ${needsUpdate}`);

    if (needsUpdate === 0) {
      console.log('\n✓ All products already have jewelry_sub_type_id set!');
      return;
    }

    // Show sample products that will be updated
    console.log('\nSample products to update (first 5):');
    const sampleProducts = await sequelize.query(`
      SELECT p.id, p.name, p.sku, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.jewelry_sub_type_id IS NULL
      LIMIT 5
    `, { type: Sequelize.QueryTypes.SELECT });

    sampleProducts.forEach(product => {
      console.log(`  • ${product.name} (SKU: ${product.sku})`);
    });

    // Step 4: Update products
    console.log(`\n🔄 Step 4: Updating ${needsUpdate} products to Engagement...`);

    const updateResult = await sequelize.query(`
      UPDATE products
      SET jewelry_sub_type_id = :engagementId,
          updated_at = NOW()
      WHERE jewelry_sub_type_id IS NULL
    `, {
      replacements: { engagementId },
      type: Sequelize.QueryTypes.UPDATE
    });

    console.log(`✓ Successfully updated products!`);

    // Step 5: Verification
    console.log('\n📊 Step 5: Verification...');
    const verification = await sequelize.query(`
      SELECT
        jst.name as jewelry_sub_type,
        COUNT(p.id) as product_count
      FROM products p
      LEFT JOIN jewelry_sub_types jst ON p.jewelry_sub_type_id = jst.id
      GROUP BY jst.name, jst.id
      ORDER BY product_count DESC
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('\nProducts by Jewelry Sub Type:');
    verification.forEach(result => {
      const typeName = result.jewelry_sub_type || 'No Sub Type';
      console.log(`  • ${typeName}: ${result.product_count} products`);
    });

    const stillWithout = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM products
      WHERE jewelry_sub_type_id IS NULL
    `, { type: Sequelize.QueryTypes.SELECT });

    const remaining = parseInt(stillWithout[0].count);
    console.log(`\nProducts without jewelry_sub_type_id: ${remaining}`);

    if (remaining === 0) {
      console.log('\n' + '='.repeat(70));
      console.log('✅ SUCCESS! All 181 products are now categorized as Engagement Rings!');
      console.log('='.repeat(70));
    } else {
      console.log('\n⚠️  Warning: Some products still need review.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.\n');
  }
}

console.log('\n🚀 Starting migration...\n');

addJewelrySubTypeColumn()
  .then(() => {
    console.log('✅ Migration completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    process.exit(1);
  });

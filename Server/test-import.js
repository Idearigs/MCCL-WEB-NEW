// Test import with first 5 products only
const { Sequelize } = require('sequelize');
const XLSX = require('xlsx');
const path = require('path');

const sequelize = new Sequelize({
  host: '31.97.116.89',
  port: 5432,
  database: 'mcculloch_db',
  username: 'mcculloch_admin',
  password: '#mcculloch_admin#20026',
  dialect: 'postgres',
  logging: false
});

const TEST_SIZE = 5; // Only import first 5 products for testing
const DEFAULT_PRICE = 1000;
const DEFAULT_CURRENCY = 'USD';

function createSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function getLookupId(tableName, valueName) {
  if (!valueName || String(valueName).trim() === '' || String(valueName) === '#N/A') {
    return null;
  }

  const cleanValue = String(valueName).trim();
  const [results] = await sequelize.query(
    `SELECT id FROM "${tableName}" WHERE name = :name LIMIT 1`,
    { replacements: { name: cleanValue } }
  );

  return results.length > 0 ? results[0].id : null;
}

async function testImport() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    const excelPath = path.join(__dirname, '..', 'Product-list.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log('═══════════════════════════════════════════');
    console.log('    TEST IMPORT - FIRST 5 PRODUCTS');
    console.log('═══════════════════════════════════════════\n');

    const testData = data.slice(0, TEST_SIZE);
    let successCount = 0;

    for (let i = 0; i < testData.length; i++) {
      const row = testData[i];
      console.log(`\n📦 Testing Product ${i + 1}/${TEST_SIZE}:`);
      console.log(`   Name: ${row['Name'] || 'MISSING'}`);
      console.log(`   Code: ${row['code '] || 'MISSING'}`);
      console.log(`   Ring Style-1: ${row['Ring Style-1'] || 'MISSING'}`);
      console.log(`   Stone Shape: ${row['Stone Shape'] || 'MISSING'}`);
      console.log(`   Stone Type: ${row['Stone Type'] || 'MISSING'}`);

      try {
        const code = row['code '] ? String(row['code ']).trim() : null;
        const name = row['Name'] ? String(row['Name']).trim() : `Test Name ${i + 1}`;
        const description = row['Description'] ? String(row['Description']).trim() : `Test Description ${i + 1}`;
        const slug = createSlug(name) + (code ? `-${code.toLowerCase()}` : `-${i + 1}`);

        const ringStyle1Id = await getLookupId('ring_types', row['Ring Style-1']);
        const ringStyle2Id = await getLookupId('ring_types', row['Ring Style-2']);
        const ringStyle3Id = await getLookupId('ring_types', row['Ring Style-3']);
        const ringStyle4Id = await getLookupId('ring_types', row['Ring Style-4']);
        const stoneShapeId = await getLookupId('stone_shapes', row['Stone Shape']);
        const stoneTypeId = await getLookupId('stone_types', row['Stone Type']);

        const productData = {
          sku: code || `SKU-${i + 1}`,
          name, slug, description,
          base_price: DEFAULT_PRICE,
          currency: DEFAULT_CURRENCY,
          is_active: true,
          is_featured: false,
          in_stock: true,
          ring_style_1_id: ringStyle1Id,
          ring_style_2_id: ringStyle2Id,
          ring_style_3_id: ringStyle3Id,
          ring_style_4_id: ringStyle4Id,
          ring_style_5_id: null,
          stone_shape_id: stoneShapeId,
          stone_type_id: stoneTypeId
        };

        console.log(`\n   📝 Prepared data:`);
        console.log(`      SKU: ${productData.sku}`);
        console.log(`      Name: ${productData.name}`);
        console.log(`      Slug: ${productData.slug}`);
        console.log(`      Ring Styles: ${[ringStyle1Id, ringStyle2Id, ringStyle3Id, ringStyle4Id].filter(Boolean).length} found`);
        console.log(`      Stone Shape ID: ${stoneShapeId ? '✓' : '✗'}`);
        console.log(`      Stone Type ID: ${stoneTypeId ? '✓' : '✗'}`);

        await sequelize.query(`
          INSERT INTO products (
            sku, name, slug, description, base_price, currency,
            is_active, is_featured, in_stock,
            ring_style_1_id, ring_style_2_id, ring_style_3_id, ring_style_4_id, ring_style_5_id,
            stone_shape_id, stone_type_id,
            created_at, updated_at
          ) VALUES (
            :sku, :name, :slug, :description, :base_price, :currency,
            :is_active, :is_featured, :in_stock,
            :ring_style_1_id, :ring_style_2_id, :ring_style_3_id, :ring_style_4_id, :ring_style_5_id,
            :stone_shape_id, :stone_type_id,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `, { replacements: productData });

        console.log(`\n   ✅ SUCCESS!\n`);
        successCount++;

      } catch (error) {
        console.error(`\n   ❌ ERROR: ${error.message}\n`);
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log(`✅ Test complete: ${successCount}/${TEST_SIZE} products imported`);
    console.log('═══════════════════════════════════════════\n');

    const [count] = await sequelize.query('SELECT COUNT(*) as total FROM products');
    console.log(`📦 Total products in database: ${count[0].total}\n`);

    if (successCount === TEST_SIZE) {
      console.log('🎉 TEST PASSED! Ready to run full import.\n');
      console.log('Run: node import-products.js\n');
    } else {
      console.log('⚠️  Some products failed. Review errors above.\n');
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

testImport();

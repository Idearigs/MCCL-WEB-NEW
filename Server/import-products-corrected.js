const { Sequelize } = require('sequelize');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const sequelize = new Sequelize({
  host: '31.97.116.89',
  port: 5432,
  database: 'mcculloch_db',
  username: 'mcculloch_admin',
  password: '#mcculloch_admin#20026',
  dialect: 'postgres',
  logging: false
});

// Configuration
const BATCH_SIZE = 10;
const DEFAULT_PRICE = 1000;
const DEFAULT_CURRENCY = 'USD';
const RINGS_CATEGORY_ID = '43b1d201-b95e-4ad3-ab21-12119403179f';

// Metal IDs to add to all products (Yellow Gold, Silver, Rose Gold, Platinum)
const DEFAULT_METAL_IDS = [
  '39b04f2f-1d7f-442a-b1f6-dc355c7b5976', // Yellow Gold
  '9c2434bd-02a7-4189-bd9d-51d25e1f74c5', // Silver
  '15d201d9-089b-43d8-9306-85f61971ae44', // Rose Gold
  'a9e8f0d3-15d2-4c79-9143-c1eaee950ca9'  // Platinum
];

// Default metal_id (Yellow Gold)
const DEFAULT_METAL_ID = '39b04f2f-1d7f-442a-b1f6-dc355c7b5976';

function createSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function getLookupId(tableName, valueName) {
  if (!valueName || String(valueName).trim() === '' || String(valueName) === '#N/A') {
    return null;
  }

  const cleanValue = String(valueName).trim();

  try {
    const [results] = await sequelize.query(
      `SELECT id FROM "${tableName}" WHERE name = :name LIMIT 1`,
      { replacements: { name: cleanValue } }
    );

    if (results.length > 0) {
      return results[0].id;
    }

    console.warn(`   ⚠️  Warning: "${cleanValue}" not found in ${tableName}`);
    return null;
  } catch (error) {
    console.error(`   ❌ Error looking up "${cleanValue}" in ${tableName}:`, error.message);
    return null;
  }
}

async function prepareProductData(row, index) {
  const code = row['code '] ? String(row['code ']).trim() : null;
  let name = row['Name'] ? String(row['Name']).trim() : null;
  let description = row['Description'] ? String(row['Description']).trim() : null;

  if (!name || name === '' || name === '#N/A') {
    name = `Test Name ${index + 1}`;
    console.log(`   ⚠️  Row ${index + 1}: Generated name "${name}"`);
  }

  if (!description || description === '' || description === '#N/A') {
    description = `Test Description ${index + 1}`;
    console.log(`   ⚠️  Row ${index + 1}: Generated description`);
  }

  const slug = createSlug(name) + (code ? `-${code.toLowerCase()}` : `-${index + 1}`);

  // Get lookup IDs from ring_types table
  const ringStyle1Id = await getLookupId('ring_types', row['Ring Style-1']);
  const ringStyle2Id = await getLookupId('ring_types', row['Ring Style-2']);
  const ringStyle3Id = await getLookupId('ring_types', row['Ring Style-3']);
  const ringStyle4Id = await getLookupId('ring_types', row['Ring Style-4']);
  const stoneShapeId = await getLookupId('stone_shapes', row['Stone Shape']);
  const stoneTypeId = await getLookupId('stone_types', row['Stone Type']);

  return {
    sku: code || `SKU-${index + 1}`,
    name: name,
    slug: slug,
    description: description,
    base_price: DEFAULT_PRICE,
    currency: DEFAULT_CURRENCY,
    is_active: true,
    is_featured: false,
    in_stock: true,
    category_id: RINGS_CATEGORY_ID, // All products are Rings
    metal_id: DEFAULT_METAL_ID, // Default to Yellow Gold
    ring_type_id: null, // Not in Excel, leave NULL
    ring_style_1_id: ringStyle1Id,
    ring_style_2_id: ringStyle2Id,
    ring_style_3_id: ringStyle3Id,
    ring_style_4_id: ringStyle4Id,
    ring_style_5_id: null, // Not in Excel
    stone_shape_id: stoneShapeId,
    stone_type_id: stoneTypeId
  };
}

async function addMetalsToProduct(productId) {
  // Add all 4 metals to product_metals_junction table
  for (const metalId of DEFAULT_METAL_IDS) {
    try {
      await sequelize.query(`
        INSERT INTO product_metals_junction (product_id, metal_id, created_at, updated_at)
        VALUES (:product_id, :metal_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING
      `, {
        replacements: {
          product_id: productId,
          metal_id: metalId
        }
      });
    } catch (error) {
      console.warn(`   ⚠️  Could not add metal to product: ${error.message}`);
    }
  }
}

async function importProducts() {
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    const excelPath = path.join(__dirname, '..', 'Product-list.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log('═══════════════════════════════════════════');
    console.log('    CORRECTED PRODUCT IMPORT');
    console.log('═══════════════════════════════════════════\n');
    console.log(`📦 Total products to import: ${data.length}`);
    console.log(`📊 Batch size: ${BATCH_SIZE} products per batch`);
    console.log(`📈 Total batches: ${Math.ceil(data.length / BATCH_SIZE)}`);
    console.log(`\n✨ NEW FEATURES:`);
    console.log(`   • Category: Rings (all products)`);
    console.log(`   • Metals: Yellow Gold, Silver, Rose Gold, Platinum (all products)`);
    console.log(`   • Default Metal: Yellow Gold`);
    console.log(`   • Stone Shapes: Imported from Excel`);
    console.log(`   • Ring Styles 1-4: Imported from Excel\n`);

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(data.length / BATCH_SIZE);

      console.log(`\n╔═══════════════════════════════════════════╗`);
      console.log(`║   BATCH ${batchNumber}/${totalBatches} (Products ${i + 1}-${Math.min(i + BATCH_SIZE, data.length)})      `);
      console.log(`╚═══════════════════════════════════════════╝\n`);

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const rowNumber = i + j + 1;

        try {
          console.log(`📦 Processing Product ${rowNumber}/${data.length}...`);

          const productData = await prepareProductData(row, i + j);

          // Insert product
          const [result] = await sequelize.query(`
            INSERT INTO products (
              sku, name, slug, description, base_price, currency,
              is_active, is_featured, in_stock,
              category_id, metal_id, ring_type_id,
              ring_style_1_id, ring_style_2_id, ring_style_3_id, ring_style_4_id, ring_style_5_id,
              stone_shape_id, stone_type_id,
              created_at, updated_at
            ) VALUES (
              :sku, :name, :slug, :description, :base_price, :currency,
              :is_active, :is_featured, :in_stock,
              :category_id, :metal_id, :ring_type_id,
              :ring_style_1_id, :ring_style_2_id, :ring_style_3_id, :ring_style_4_id, :ring_style_5_id,
              :stone_shape_id, :stone_type_id,
              CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
            RETURNING id
          `, {
            replacements: productData
          });

          const productId = result[0].id;

          // Add all 4 metals to junction table
          await addMetalsToProduct(productId);

          console.log(`   ✅ SUCCESS: "${productData.name}" (SKU: ${productData.sku})`);
          console.log(`      • Category: Rings ✓`);
          console.log(`      • Metals: 4 options added ✓`);
          console.log(`      • Stone Shape: ${productData.stone_shape_id ? '✓' : '✗'}`);
          console.log(`      • Ring Styles: ${[productData.ring_style_1_id, productData.ring_style_2_id, productData.ring_style_3_id, productData.ring_style_4_id].filter(Boolean).length} set`);

          successCount++;

        } catch (error) {
          console.error(`   ❌ ERROR: Product ${rowNumber} failed - ${error.message}`);
          errors.push({
            row: rowNumber,
            data: row,
            error: error.message
          });
          errorCount++;
        }
      }

      if (i + BATCH_SIZE < data.length) {
        console.log(`\n   ⏳ Batch complete. Pausing for 1 second...\n`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n\n═══════════════════════════════════════════');
    console.log('    IMPORT COMPLETE - SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    console.log(`✅ Successfully imported: ${successCount} products`);
    console.log(`❌ Failed: ${errorCount} products`);
    console.log(`📊 Success rate: ${((successCount / data.length) * 100).toFixed(2)}%\n`);

    if (errors.length > 0) {
      console.log('❌ ERRORS:\n');
      errors.forEach(err => {
        console.log(`   Row ${err.row}: ${err.error}`);
      });

      fs.writeFileSync(
        path.join(__dirname, 'import-errors.json'),
        JSON.stringify(errors, null, 2)
      );
      console.log('\n💾 Errors saved to: import-errors.json\n');
    }

    const [count] = await sequelize.query('SELECT COUNT(*) as total FROM products');
    console.log(`📦 Total products in database: ${count[0].total}\n`);

    console.log('═══════════════════════════════════════════\n');

    await sequelize.close();

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

importProducts();

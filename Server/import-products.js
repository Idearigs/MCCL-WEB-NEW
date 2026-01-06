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
const BATCH_SIZE = 10; // Process 10 products at a time
const DEFAULT_PRICE = 1000; // Default price if not specified
const DEFAULT_CURRENCY = 'USD';

// Helper function to create slug from name
function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Helper function to get lookup ID
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

// Validate and prepare product data
async function prepareProductData(row, index) {
  // Handle missing or invalid names
  const code = row['code '] ? String(row['code ']).trim() : null;
  let name = row['Name'] ? String(row['Name']).trim() : null;
  let description = row['Description'] ? String(row['Description']).trim() : null;

  // Generate test name/description if missing
  if (!name || name === '' || name === '#N/A') {
    name = `Test Name ${index + 1}`;
    console.log(`   ⚠️  Row ${index + 1}: Generated name "${name}"`);
  }

  if (!description || description === '' || description === '#N/A') {
    description = `Test Description ${index + 1}`;
    console.log(`   ⚠️  Row ${index + 1}: Generated description`);
  }

  // Create slug
  const slug = createSlug(name) + (code ? `-${code.toLowerCase()}` : `-${index + 1}`);

  // Get lookup IDs
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
    ring_style_1_id: ringStyle1Id,
    ring_style_2_id: ringStyle2Id,
    ring_style_3_id: ringStyle3Id,
    ring_style_4_id: ringStyle4Id,
    ring_style_5_id: null, // Not in Excel
    stone_shape_id: stoneShapeId,
    stone_type_id: stoneTypeId
  };
}

// Import products in batches
async function importProducts() {
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Read Excel file
    const excelPath = path.join(__dirname, '..', 'Product-list.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log('═══════════════════════════════════════════');
    console.log('    PRODUCT IMPORT - BATCH PROCESSING');
    console.log('═══════════════════════════════════════════\n');
    console.log(`📦 Total products to import: ${data.length}`);
    console.log(`📊 Batch size: ${BATCH_SIZE} products per batch`);
    console.log(`📈 Total batches: ${Math.ceil(data.length / BATCH_SIZE)}\n`);

    // Process in batches
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

          // Prepare data with validation
          const productData = await prepareProductData(row, i + j);

          // Insert into database
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
          `, {
            replacements: productData
          });

          console.log(`   ✅ SUCCESS: "${productData.name}" (SKU: ${productData.sku})`);
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

      // Small delay between batches
      if (i + BATCH_SIZE < data.length) {
        console.log(`\n   ⏳ Batch complete. Pausing for 1 second...\n`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Final summary
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

      // Save errors to file
      fs.writeFileSync(
        path.join(__dirname, 'import-errors.json'),
        JSON.stringify(errors, null, 2)
      );
      console.log('\n💾 Errors saved to: import-errors.json\n');
    }

    // Verify database count
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

// Run import
importProducts();

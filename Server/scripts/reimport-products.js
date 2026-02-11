/**
 * Re-import products from Excel file
 * Handles diamond size variants by keeping only one product per base SKU
 */
const { Pool } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
});

const RINGS_CATEGORY_ID = '43b1d201-b95e-4ad3-ab21-12119403179f';
const DEFAULT_PRICE = 1000;
const DEFAULT_CURRENCY = 'USD';

// Metal IDs
const DEFAULT_METAL_IDS = [
  '39b04f2f-1d7f-442a-b1f6-dc355c7b5976', // Yellow Gold
  '9c2434bd-02a7-4189-bd9d-51d25e1f74c5', // Silver
  '15d201d9-089b-43d8-9306-85f61971ae44', // Rose Gold
  'a9e8f0d3-15d2-4c79-9143-c1eaee950ca9'  // Platinum
];
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
    const result = await pool.query(
      `SELECT id FROM "${tableName}" WHERE name = $1 LIMIT 1`,
      [cleanValue]
    );
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (error) {
    return null;
  }
}

async function importProducts() {
  try {
    await pool.query('SELECT 1');
    console.log('✓ Connected to database\n');

    const excelPath = path.join(__dirname, '..', '..', 'Product-list.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Total rows in Excel: ${data.length}`);

    // De-duplicate: keep only first row per base SKU
    const seen = new Set();
    const uniqueRows = [];
    let skippedVariants = 0;

    for (const row of data) {
      const rawCode = String(row['code '] || '').trim();
      // Extract base SKU by removing diamond size suffix like (A), (B), etc.
      const baseSku = rawCode.replace(/\s*-?\s*\([A-F]\)/g, '').trim();

      if (seen.has(baseSku)) {
        skippedVariants++;
        continue;
      }
      seen.add(baseSku);
      // Override code with clean base SKU
      row._cleanSku = baseSku;
      uniqueRows.push(row);
    }

    console.log(`Unique products to import: ${uniqueRows.length}`);
    console.log(`Diamond size variant rows skipped: ${skippedVariants}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < uniqueRows.length; i++) {
      const row = uniqueRows[i];
      const sku = row._cleanSku;
      let name = row['Name'] ? String(row['Name']).trim() : null;
      let description = row['Description'] ? String(row['Description']).trim() : null;

      if (!name || name === '' || name === '#N/A') {
        name = `Test Name ${i + 1}`;
      }
      if (!description || description === '' || description === '#N/A') {
        description = `Test Description ${i + 1}`;
      }

      const slug = createSlug(name) + `-${sku.toLowerCase()}`;

      // Get lookup IDs
      const ringStyle1Id = await getLookupId('ring_types', row['Ring Style-1']);
      const ringStyle2Id = await getLookupId('ring_types', row['Ring Style-2']);
      const ringStyle3Id = await getLookupId('ring_types', row['Ring Style-3']);
      const ringStyle4Id = await getLookupId('ring_types', row['Ring Style-4']);
      const stoneShapeId = await getLookupId('stone_shapes', row['Stone Shape']);
      const stoneTypeId = await getLookupId('stone_types', row['Stone Type']);

      try {
        const [result] = await pool.query(`
          INSERT INTO products (
            id, sku, name, slug, description, base_price, currency,
            is_active, is_featured, in_stock,
            category_id, metal_id, ring_type_id,
            ring_style_1_id, ring_style_2_id, ring_style_3_id, ring_style_4_id, ring_style_5_id,
            stone_shape_id, stone_type_id,
            created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6,
            $7, $8, $9,
            $10, $11, $12,
            $13, $14, $15, $16, $17,
            $18, $19,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          RETURNING id
        `, [
          sku, name, slug, description, DEFAULT_PRICE, DEFAULT_CURRENCY,
          true, false, true,
          RINGS_CATEGORY_ID, DEFAULT_METAL_ID, null,
          ringStyle1Id, ringStyle2Id, ringStyle3Id, ringStyle4Id, null,
          stoneShapeId, stoneTypeId
        ]);

        const productId = result.id;

        // Add metals to junction table
        for (const metalId of DEFAULT_METAL_IDS) {
          await pool.query(`
            INSERT INTO product_metals_junction (product_id, metal_id, created_at, updated_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING
          `, [productId, metalId]);
        }

        successCount++;
        if (successCount % 20 === 0) {
          console.log(`  Imported ${successCount}/${uniqueRows.length}...`);
        }

      } catch (error) {
        console.error(`  Error importing ${sku} (${name}): ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('    IMPORT COMPLETE');
    console.log('═══════════════════════════════════════════');
    console.log(`✓ Imported: ${successCount} products`);
    console.log(`✗ Failed: ${errorCount} products`);

    const finalCount = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log(`\nTotal products in database: ${finalCount.rows[0].count}`);

  } catch (error) {
    console.error('FATAL ERROR:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

importProducts();

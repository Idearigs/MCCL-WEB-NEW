const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  host: '31.97.116.89',
  port: 5432,
  database: 'mcculloch_db',
  username: 'mcculloch_admin',
  password: '#mcculloch_admin#20026',
  dialect: 'postgres',
  logging: false
});

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
    console.warn(`Warning: "${cleanValue}" not found in ${tableName}`);
    return null;
  } catch (error) {
    console.error(`Error looking up "${cleanValue}" in ${tableName}:`, error.message);
    return null;
  }
}

async function updateStoneShapes() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Update products with correct stone shapes from duplicate Excel rows
    const updates = [
      { sku: 'BJ-073', stoneShape: 'Emerald' },
      { sku: 'BJ-074', stoneShape: 'Marquise' },
      { sku: 'BJ-075', stoneShape: 'Oval' }
    ];

    console.log('Updating stone shapes for products:\n');

    for (const update of updates) {
      const stoneShapeId = await getLookupId('stone_shapes', update.stoneShape);

      if (stoneShapeId) {
        await sequelize.query(`
          UPDATE products
          SET stone_shape_id = :stone_shape_id,
              updated_at = CURRENT_TIMESTAMP
          WHERE sku = :sku
        `, {
          replacements: {
            sku: update.sku,
            stone_shape_id: stoneShapeId
          }
        });
        console.log(`✅ Updated ${update.sku} → Stone Shape: ${update.stoneShape}`);
      } else {
        console.log(`❌ Could not find stone shape '${update.stoneShape}' for ${update.sku}`);
      }
    }

    // Note about BJ-072
    console.log('\n⚠️  BJ-072 (Arabella) has no stone shape in Excel file');
    console.log('   This product will remain without a stone shape until manually updated\n');

    // Verify updates
    console.log('\n═══════════════════════════════════════════');
    console.log('VERIFICATION');
    console.log('═══════════════════════════════════════════\n');

    const [productsWithoutStoneShape] = await sequelize.query(`
      SELECT sku, name, stone_shape_id
      FROM products
      WHERE stone_shape_id IS NULL
      ORDER BY sku
    `);

    console.log(`Products WITHOUT Stone Shape: ${productsWithoutStoneShape.length}`);
    if (productsWithoutStoneShape.length > 0) {
      productsWithoutStoneShape.forEach(p => {
        console.log(`  ${p.sku}: ${p.name}`);
      });
    }

    const [productsWithStoneShape] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM products
      WHERE stone_shape_id IS NOT NULL
    `);
    console.log(`\nProducts WITH Stone Shape: ${productsWithStoneShape[0].count}`);
    console.log('\n═══════════════════════════════════════════\n');

    await sequelize.close();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

updateStoneShapes();

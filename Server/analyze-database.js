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

async function analyzeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    console.log('═══════════════════════════════════════════════════');
    console.log('    COMPLETE DATABASE STRUCTURE ANALYSIS');
    console.log('═══════════════════════════════════════════════════\n');

    // 1. List ALL tables in database
    console.log('📋 ALL TABLES IN DATABASE:\n');
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    tables.forEach((table, idx) => {
      console.log(`   ${idx + 1}. ${table.table_name}`);
    });

    // 2. Check if metals table exists
    console.log('\n\n🔍 CHECKING FOR METALS TABLE:\n');
    const [metalCheck] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'metals'
      )
    `);
    console.log(`   Metals table exists: ${metalCheck[0].exists ? 'YES ✓' : 'NO ✗'}`);

    if (metalCheck[0].exists) {
      const [metalCount] = await sequelize.query('SELECT COUNT(*) as count FROM metals');
      console.log(`   Records in metals table: ${metalCount[0].count}`);

      const [metals] = await sequelize.query('SELECT name FROM metals ORDER BY name LIMIT 10');
      console.log('\n   Sample metals:');
      metals.forEach(m => console.log(`      • ${m.name}`));
    }

    // 3. Get FULL products table structure
    console.log('\n\n📦 PRODUCTS TABLE - COMPLETE COLUMN LIST:\n');
    const [productColumns] = await sequelize.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);

    productColumns.forEach((col, idx) => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
      const hasDefault = col.column_default ? '(has default)' : '';
      console.log(`   ${idx + 1}. ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable} ${hasDefault}`);
    });

    // 4. Check for metal-related columns in products
    console.log('\n\n🔧 METAL-RELATED COLUMNS IN PRODUCTS TABLE:\n');
    const metalColumns = productColumns.filter(col =>
      col.column_name.includes('metal')
    );

    if (metalColumns.length > 0) {
      metalColumns.forEach(col => {
        console.log(`   ✓ Found: ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('   ✗ No metal columns found');
    }

    // 5. Check ALL foreign keys in products table
    console.log('\n\n🔗 ALL FOREIGN KEYS IN PRODUCTS TABLE:\n');
    const [foreignKeys] = await sequelize.query(`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'products'
        AND tc.constraint_type = 'FOREIGN KEY'
      ORDER BY kcu.column_name
    `);

    if (foreignKeys.length > 0) {
      foreignKeys.forEach((fk, idx) => {
        console.log(`   ${idx + 1}. ${fk.column_name.padEnd(25)} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }

    // 6. Sample product to see actual data structure
    console.log('\n\n📄 SAMPLE PRODUCT (First Record):\n');
    const [sampleProduct] = await sequelize.query(`
      SELECT * FROM products LIMIT 1
    `);

    if (sampleProduct.length > 0) {
      const product = sampleProduct[0];
      console.log('   Key fields:');
      console.log(`      • id: ${product.id}`);
      console.log(`      • sku: ${product.sku}`);
      console.log(`      • name: ${product.name}`);
      console.log(`      • category_id: ${product.category_id || 'NULL'}`);
      console.log(`      • ring_type_id: ${product.ring_type_id || 'NULL'}`);
      console.log(`      • metal_id: ${product.metal_id || 'NULL'}`);
      console.log(`      • stone_shape_id: ${product.stone_shape_id || 'NULL'}`);
      console.log(`      • stone_type_id: ${product.stone_type_id || 'NULL'}`);
      console.log(`      • ring_style_1_id: ${product.ring_style_1_id || 'NULL'}`);
      console.log(`      • ring_style_2_id: ${product.ring_style_2_id || 'NULL'}`);
    }

    console.log('\n═══════════════════════════════════════════════════\n');

    await sequelize.close();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

analyzeDatabase();

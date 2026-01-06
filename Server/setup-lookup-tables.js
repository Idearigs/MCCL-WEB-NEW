const { Sequelize } = require('sequelize');
const fs = require('fs');
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

async function setupLookupTables() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Read lookup data
    const lookupData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'lookup-data.json'), 'utf8')
    );

    console.log('═══════════════════════════════════════════');
    console.log('    SETTING UP LOOKUP TABLES');
    console.log('═══════════════════════════════════════════\n');

    // 1. Create ring_styles table if it doesn't exist
    console.log('📋 Creating ring_styles table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "ring_styles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) NOT NULL UNIQUE,
        "slug" VARCHAR(100) NOT NULL UNIQUE,
        "description" TEXT,
        "is_active" BOOLEAN DEFAULT true,
        "sort_order" INTEGER DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ ring_styles table created\n');

    // 2. Insert ring styles
    console.log('💍 Inserting Ring Styles...');
    for (const style of lookupData.ringStyles) {
      const slug = style.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      await sequelize.query(`
        INSERT INTO "ring_styles" (name, slug)
        VALUES (:name, :slug)
        ON CONFLICT (name) DO NOTHING
      `, {
        replacements: { name: style, slug: slug }
      });

      console.log(`   ✓ ${style}`);
    }

    // Get ring styles count
    const [ringStylesCount] = await sequelize.query('SELECT COUNT(*) as count FROM ring_styles');
    console.log(`\n✅ Total Ring Styles: ${ringStylesCount[0].count}\n`);

    // 3. Check and update stone_shapes
    console.log('💎 Checking Stone Shapes...');
    const [existingShapes] = await sequelize.query('SELECT name FROM stone_shapes');
    const existingShapeNames = existingShapes.map(s => s.name);

    for (const shape of lookupData.stoneShapes) {
      if (!existingShapeNames.includes(shape)) {
        const slug = shape.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        await sequelize.query(`
          INSERT INTO "stone_shapes" (name, slug)
          VALUES (:name, :slug)
          ON CONFLICT (name) DO NOTHING
        `, {
          replacements: { name: shape, slug: slug }
        });

        console.log(`   + Added: ${shape}`);
      } else {
        console.log(`   ✓ Exists: ${shape}`);
      }
    }

    const [stoneShapesCount] = await sequelize.query('SELECT COUNT(*) as count FROM stone_shapes');
    console.log(`\n✅ Total Stone Shapes: ${stoneShapesCount[0].count}\n`);

    // 4. Check and update stone_types
    console.log('🔷 Checking Stone Types...');
    const [existingTypes] = await sequelize.query('SELECT name FROM stone_types');
    const existingTypeNames = existingTypes.map(t => t.name);

    for (const type of lookupData.stoneTypes) {
      if (!existingTypeNames.includes(type)) {
        const slug = type.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        await sequelize.query(`
          INSERT INTO "stone_types" (name, slug)
          VALUES (:name, :slug)
          ON CONFLICT (name) DO NOTHING
        `, {
          replacements: { name: type, slug: slug }
        });

        console.log(`   + Added: ${type}`);
      } else {
        console.log(`   ✓ Exists: ${type}`);
      }
    }

    const [stoneTypesCount] = await sequelize.query('SELECT COUNT(*) as count FROM stone_types');
    console.log(`\n✅ Total Stone Types: ${stoneTypesCount[0].count}\n`);

    console.log('═══════════════════════════════════════════');
    console.log('    LOOKUP TABLES READY!');
    console.log('═══════════════════════════════════════════\n');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupLookupTables();

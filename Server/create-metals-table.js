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

async function createMetalsTable() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected\n');

    // Create metals table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "metals" (
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

    console.log('✓ Metals table created\n');

    // Insert common metals
    const metals = [
      '9ct Yellow Gold',
      '9ct White Gold',
      '9ct Rose Gold',
      '18ct Yellow Gold',
      '18ct White Gold',
      '18ct Rose Gold',
      'Platinum',
      'Silver',
      'Palladium'
    ];

    console.log('Adding metals:\n');
    for (const metal of metals) {
      const slug = metal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await sequelize.query(`
        INSERT INTO "metals" (name, slug)
        VALUES (:name, :slug)
        ON CONFLICT (name) DO NOTHING
      `, {
        replacements: { name: metal, slug: slug }
      });
      console.log(`   ✓ ${metal}`);
    }

    const [count] = await sequelize.query('SELECT COUNT(*) as count FROM metals');
    console.log(`\n✅ Total metals: ${count[0].count}\n`);

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createMetalsTable();

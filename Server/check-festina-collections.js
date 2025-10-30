const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const sequelize = new Sequelize({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'mcculloch_db',
  username: process.env.PG_USERNAME || 'postgres',
  password: process.env.PG_PASSWORD,
  dialect: 'postgres',
  logging: false
});

async function checkFestinaCollections() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection successful!\n');

    // Get Festina brand
    const results = await sequelize.query(`
      SELECT id, name FROM watch_brands WHERE name ILIKE 'Festina'
    `);

    if (results[0].length === 0) {
      console.log('❌ Festina brand not found in database');
      await sequelize.close();
      return;
    }

    const festinaBrand = results[0][0];
    console.log(`✓ Found Festina brand: ${festinaBrand.id}`);
    console.log(`\nCollections for Festina (brand_id: ${festinaBrand.id}):`);

    const collections = await sequelize.query(`
      SELECT id, name, slug, is_active, created_at FROM watch_collections
      WHERE brand_id = '${festinaBrand.id}'
      ORDER BY created_at DESC
    `);

    if (collections[0].length === 0) {
      console.log('❌ No collections found for Festina brand');
    } else {
      console.log(`\n✓ Found ${collections[0].length} collection(s):`);
      collections[0].forEach((coll, index) => {
        console.log(`\n[${index + 1}] ${coll.name}`);
        console.log(`    ID: ${coll.id}`);
        console.log(`    Slug: ${coll.slug}`);
        console.log(`    Active: ${coll.is_active}`);
        console.log(`    Created: ${coll.created_at}`);
      });
    }

    // Also show all brands and their collection counts
    console.log('\n\n=== All Brands and Collection Counts ===');
    const brandCounts = await sequelize.query(`
      SELECT
        b.id,
        b.name,
        COUNT(c.id) as collection_count
      FROM watch_brands b
      LEFT JOIN watch_collections c ON b.id = c.brand_id
      GROUP BY b.id, b.name
      ORDER BY b.name
    `);

    brandCounts[0].forEach(brand => {
      console.log(`${brand.name}: ${brand.collection_count} collection(s)`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkFestinaCollections();

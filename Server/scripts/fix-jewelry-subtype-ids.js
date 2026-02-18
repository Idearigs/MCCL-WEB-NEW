/**
 * Fix missing jewelry_sub_type_id on ring products.
 * Sets jewelry_sub_type_id = engagement rings sub type for all products
 * in the "rings" category that have SKU prefix BJ- (engagement ring products).
 *
 * Run: node Server/scripts/fix-jewelry-subtype-ids.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE,
  user: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
  ssl: false
});

async function main() {
  const client = await pool.connect();
  try {
    // Get the engagement rings sub type id
    const engRes = await client.query(
      `SELECT id FROM jewelry_sub_types WHERE slug = 'engagement-rings' LIMIT 1`
    );
    if (engRes.rows.length === 0) {
      console.log('No engagement-rings sub type found in jewelry_sub_types table.');
      return;
    }
    const engId = engRes.rows[0].id;
    console.log(`Engagement rings sub type ID: ${engId}`);

    // Get the rings category id
    const catRes = await client.query(
      `SELECT id FROM categories WHERE slug = 'rings' LIMIT 1`
    );
    if (catRes.rows.length === 0) {
      console.log('No rings category found.');
      return;
    }
    const catId = catRes.rows[0].id;
    console.log(`Rings category ID: ${catId}`);

    // Count products that need updating
    const countRes = await client.query(
      `SELECT COUNT(*) as cnt FROM products WHERE category_id = $1 AND jewelry_sub_type_id IS NULL`,
      [catId]
    );
    console.log(`Products in rings category without jewelry_sub_type_id: ${countRes.rows[0].cnt}`);

    if (parseInt(countRes.rows[0].cnt) === 0) {
      console.log('All ring products already have jewelry_sub_type_id set!');
      return;
    }

    // Update all ring products to engagement rings
    const updateRes = await client.query(
      `UPDATE products SET jewelry_sub_type_id = $1, updated_at = NOW() WHERE category_id = $2 AND jewelry_sub_type_id IS NULL RETURNING sku, name`,
      [engId, catId]
    );
    console.log(`Updated ${updateRes.rowCount} products:`);
    updateRes.rows.forEach(r => console.log(`  - ${r.sku}: ${r.name}`));

    console.log('\nDone!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

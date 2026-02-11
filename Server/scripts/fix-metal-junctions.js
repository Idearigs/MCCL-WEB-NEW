/**
 * Fix product_metals_junction for engagement ring products
 * Sets metals to Rose Gold, White Gold, Yellow Gold (matching actual images)
 */
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
});

async function fix() {
  try {
    // Get the 3 correct metal IDs
    const metals = await pool.query(
      `SELECT id, name FROM product_metals WHERE name IN ('Rose Gold', 'White Gold', 'Yellow Gold')`
    );
    const metalIds = metals.rows.map(r => r.id);
    console.log('Target metals:', metals.rows.map(r => r.name).join(', '));

    // Get all products with diamond sizes
    const prods = await pool.query(`
      SELECT DISTINCT p.id, p.sku
      FROM products p
      INNER JOIN product_diamond_sizes pds ON pds.product_id = p.id
      ORDER BY p.sku
    `);

    console.log(`\nFixing ${prods.rows.length} products...\n`);

    for (const p of prods.rows) {
      // Delete existing junction entries
      await pool.query('DELETE FROM product_metals_junction WHERE product_id = $1', [p.id]);

      // Insert correct metals
      for (const metalId of metalIds) {
        await pool.query(
          `INSERT INTO product_metals_junction (product_id, metal_id, created_at, updated_at)
           VALUES ($1, $2, NOW(), NOW()) ON CONFLICT DO NOTHING`,
          [p.id, metalId]
        );
      }
      console.log(`  ${p.sku}: Updated to Rose Gold, White Gold, Yellow Gold`);
    }

    // Verify
    console.log('\nVerification:');
    for (const p of prods.rows) {
      const check = await pool.query(
        `SELECT pm.name FROM product_metals_junction pmj
         JOIN product_metals pm ON pm.id = pmj.metal_id
         WHERE pmj.product_id = $1 ORDER BY pm.name`,
        [p.id]
      );
      console.log(`  ${p.sku}: [${check.rows.map(r => r.name).join(', ')}]`);
    }

    console.log('\nDone!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

fix();

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'mcculloch_db',
  user: process.env.PG_USERNAME || 'postgres',
  password: process.env.PG_PASSWORD
});

(async () => {
  try {
    const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'watch_variants' ORDER BY ordinal_position");
    console.log('watch_variants columns:', cols.rows.map(r => r.column_name).join(', '));

    const variants = await pool.query(`
      SELECT COUNT(*) as cnt FROM watch_variants wv
      JOIN watches w ON wv.watch_id = w.id
      JOIN watch_brands wb ON w.brand_id = wb.id
      WHERE wb.slug = 'roamer'
    `);
    console.log('Roamer variants:', variants.rows[0].cnt);

    // Check if variant_name column exists
    const hasVariantName = cols.rows.some(r => r.column_name === 'variant_name');
    console.log('Has variant_name:', hasVariantName);

    const hasStrapType = cols.rows.some(r => r.column_name === 'strap_type');
    console.log('Has strap_type:', hasStrapType);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();

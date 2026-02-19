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
    const brands = await pool.query('SELECT id, name, slug FROM watch_brands ORDER BY name');
    console.log('Brands:', JSON.stringify(brands.rows, null, 2));

    const counts = await pool.query(
      `SELECT wb.name, wb.slug, COUNT(w.id) as watch_count,
              COUNT(CASE WHEN w.is_active THEN 1 END) as active_count
       FROM watch_brands wb
       LEFT JOIN watches w ON w.brand_id = wb.id
       GROUP BY wb.id, wb.name, wb.slug
       ORDER BY wb.name`
    );
    console.log('\nWatch counts per brand:', JSON.stringify(counts.rows, null, 2));

    const roamer = await pool.query(
      `SELECT w.id, w.name, w.is_active, w.brand_id, wb.slug as brand_slug
       FROM watches w
       JOIN watch_brands wb ON w.brand_id = wb.id
       WHERE wb.slug = 'roamer'
       LIMIT 5`
    );
    console.log('\nSample Roamer watches:', JSON.stringify(roamer.rows, null, 2));

    // Check if columns exist
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'watches' ORDER BY ordinal_position`
    );
    console.log('\nWatches table columns:', cols.rows.map(r => r.column_name).join(', '));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();

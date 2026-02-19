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
    // Find Briston brand
    const brand = await pool.query("SELECT id, name FROM watch_brands WHERE LOWER(name) = 'briston' OR slug = 'briston'");
    if (brand.rows.length === 0) {
      console.log('No Briston brand found in database — nothing to delete.');
      return;
    }
    const brandId = brand.rows[0].id;
    console.log(`Found Briston brand: ${brandId}`);

    // Count what we're about to delete
    const watchCount = await pool.query('SELECT COUNT(*) FROM watches WHERE brand_id = $1', [brandId]);
    const collCount  = await pool.query('SELECT COUNT(*) FROM watch_collections WHERE brand_id = $1', [brandId]);
    console.log(`  Watches:     ${watchCount.rows[0].count}`);
    console.log(`  Collections: ${collCount.rows[0].count}`);

    // Get all Briston watch IDs
    const watches = await pool.query('SELECT id FROM watches WHERE brand_id = $1', [brandId]);
    const watchIds = watches.rows.map(r => r.id);

    if (watchIds.length > 0) {
      // Delete child records first
      await pool.query('DELETE FROM watch_images         WHERE watch_id = ANY($1)', [watchIds]);
      await pool.query('DELETE FROM watch_specifications WHERE watch_id = ANY($1)', [watchIds]);
      await pool.query('DELETE FROM watch_variants       WHERE watch_id = ANY($1)', [watchIds]);
      console.log('  ✅ Deleted watch images, specs, variants');

      // Delete watches
      await pool.query('DELETE FROM watches WHERE brand_id = $1', [brandId]);
      console.log('  ✅ Deleted watches');
    }

    // Delete collections
    await pool.query('DELETE FROM watch_collections WHERE brand_id = $1', [brandId]);
    console.log('  ✅ Deleted collections');

    // Delete brand
    await pool.query('DELETE FROM watch_brands WHERE id = $1', [brandId]);
    console.log('  ✅ Deleted Briston brand');

    console.log('\nDone — Briston completely cleared from database.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();

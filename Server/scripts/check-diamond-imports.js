const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
});

async function check() {
  const folders = ['BJ-101','BJ-102','BJ-103','BJ-104','BJ-105','BJ-106','BJ-107','BJ-108','BJ-109','BJ-110','BJ-111','BJ-112','BJ-113','BJ-114','BJ-115','BJ-116','BJ-117','BJ-118','BJ-119'];

  console.log('=== Products in DB vs Image Folders ===\n');
  for (const sku of folders) {
    const prod = await pool.query('SELECT id FROM products WHERE sku = $1', [sku]);
    let imgCount = 0;
    let dsCount = 0;
    if (prod.rows.length > 0) {
      const imgs = await pool.query('SELECT COUNT(*) as c FROM product_images WHERE product_id = $1 AND diamond_size_id IS NOT NULL', [prod.rows[0].id]);
      const ds = await pool.query('SELECT COUNT(*) as c FROM product_diamond_sizes WHERE product_id = $1', [prod.rows[0].id]);
      imgCount = imgs.rows[0].c;
      dsCount = ds.rows[0].c;
    }
    const status = prod.rows.length > 0
      ? (imgCount > 0 ? 'IMPORTED' : 'IN DB - NO IMAGES')
      : 'NOT IN DB';
    console.log(`${sku}: ${status} | Images: ${imgCount} | Diamond links: ${dsCount}`);
  }
  await pool.end();
}
check();

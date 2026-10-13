/**
 * One-off: set base_price for ready-to-ship rings that were £0, using the prices
 * from the client's "Live Stock - 130226 updated.xlsx" (Live Stock Rings sheet),
 * matched by product code (sku).
 *
 * Run inside the backend container (has pg + PG_* env vars + DB network access):
 *   docker exec -it mcculloch-backend node scripts/set-livestock-prices.js
 *
 * Idempotent: only updates the listed SKUs. Aquamarine (1507261) price was
 * supplied by the owner (£1,500) since it was blank in the sheet.
 */
const { Client } = require('pg');

// sku (products.sku) -> price in GBP, from the Live Stock Rings sheet
const PRICES = {
  '1507261': 1500,   // Aquamarine Trilogy Ring in 18ct Rose Gold (price supplied by owner)
  '2707266': 2650,   // Green Tourmaline Modern/Contemporary Ring in 18ct Yellow Gold
  '1909254': 2650,   // Mois Solitaire Ring in Platinum
  '021369223': 2150, // Ruby Halo Ring in 18ct White Gold
  '02421023': 1110,  // Ruby Halo Ring in 9ct Yellow Gold
  '200126007': 1850, // Ruby Halo Ring in Platinum
  '210326003': 1850, // Sapphire Trilogy Ring in 18ct Yellow Gold
};

(async () => {
  const client = new Client({
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'mcculloch_db',
    user: process.env.PG_USERNAME || 'postgres',
    password: process.env.PG_PASSWORD,
  });
  await client.connect();
  let updated = 0;
  for (const [sku, price] of Object.entries(PRICES)) {
    const r = await client.query(
      `UPDATE products SET base_price = $1 WHERE sku = $2 RETURNING name`,
      [price, sku]
    );
    if (r.rowCount) {
      console.log(`  £${price}  <-  ${r.rows[0].name} (sku ${sku})`);
      updated += r.rowCount;
    } else {
      console.log(`  (no product found for sku ${sku})`);
    }
  }
  console.log(`Done. Products priced: ${updated}`);
  await client.end();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

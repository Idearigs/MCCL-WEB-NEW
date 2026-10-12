/**
 * One-off data fix: repair media URLs that still point at the dead old API
 * domain (api.buymediamonds.co.uk) after the migration to
 * api.mccullochjewellers.co.uk. The old host returns HTTP 503, so any row
 * holding it shows a broken image/video.
 *
 * Run it INSIDE the backend container (it has pg + the PG_* env vars +
 * network access to the internal database host), e.g. via Coolify's terminal
 * for the backend app, or:
 *     docker exec -it mcculloch-backend node Server/scripts/fix-media-domain-urls.js
 *
 * Safe & idempotent: each table only has rows containing the old host rewritten.
 */
const { Client } = require('pg');

const OLD = 'api.buymediamonds.co.uk';
const NEW = 'api.mccullochjewellers.co.uk';

// [table, column] pairs that can hold an absolute media URL
const TARGETS = [
  ['product_images', 'image_url'],
  ['product_videos', 'video_url'],
  ['product_videos', 'thumbnail_url'],
  ['product_diamond_sizes', 'video_url'],
  ['categories', 'image_url'],
  ['collections', 'image_url'],
  ['promotions', 'image_url'],
  ['marketing_content', 'video_url'],
  ['watch_images', 'image_url'],
  ['watch_videos', 'video_url'],
  ['watch_videos', 'thumbnail_url'],
  ['chat_messages', 'attachment_url'],
];

(async () => {
  const client = new Client({
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'mcculloch_db',
    user: process.env.PG_USERNAME || 'postgres',
    password: process.env.PG_PASSWORD,
  });
  await client.connect();
  console.log(`Rewriting "${OLD}" -> "${NEW}"`);
  let total = 0;
  for (const [table, col] of TARGETS) {
    try {
      const r = await client.query(
        `UPDATE "${table}" SET "${col}" = REPLACE("${col}", $1, $2) WHERE "${col}" LIKE $3`,
        [OLD, NEW, `%${OLD}%`]
      );
      if (r.rowCount) console.log(`  ${table}.${col}: ${r.rowCount} rows updated`);
      total += r.rowCount;
    } catch (e) {
      console.log(`  ${table}.${col}: skipped (${e.message})`);
    }
  }
  console.log(`Done. Total rows updated: ${total}`);
  await client.end();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

-- Repair media URLs that still point at the dead old API domain (api.buymediamonds.co.uk)
-- after the migration to api.mccullochjewellers.co.uk.
-- The old host returns HTTP 503, so any row holding it shows a broken image/video.
-- Safe & idempotent: each statement only touches rows that still contain the old host.
--
-- Run with (example):
--   psql "$DATABASE_URL" -f Server/scripts/fix-media-domain-urls.sql
--
-- STEP 1 — preview how many rows are affected (optional, read-only):
--   (uncomment to run first)
-- SELECT 'product_images' t, count(*) FROM product_images WHERE image_url LIKE '%api.buymediamonds.co.uk%'
-- UNION ALL SELECT 'product_videos.video', count(*) FROM product_videos WHERE video_url LIKE '%api.buymediamonds.co.uk%'
-- UNION ALL SELECT 'product_videos.thumb', count(*) FROM product_videos WHERE thumbnail_url LIKE '%api.buymediamonds.co.uk%'
-- UNION ALL SELECT 'product_diamond_sizes', count(*) FROM product_diamond_sizes WHERE video_url LIKE '%api.buymediamonds.co.uk%'
-- UNION ALL SELECT 'categories', count(*) FROM categories WHERE image_url LIKE '%api.buymediamonds.co.uk%'
-- UNION ALL SELECT 'collections', count(*) FROM collections WHERE image_url LIKE '%api.buymediamonds.co.uk%'
-- UNION ALL SELECT 'promotions', count(*) FROM promotions WHERE image_url LIKE '%api.buymediamonds.co.uk%'
-- UNION ALL SELECT 'marketing_content', count(*) FROM marketing_content WHERE video_url LIKE '%api.buymediamonds.co.uk%'
-- UNION ALL SELECT 'watch_images', count(*) FROM watch_images WHERE image_url LIKE '%api.buymediamonds.co.uk%'
-- UNION ALL SELECT 'watch_videos.video', count(*) FROM watch_videos WHERE video_url LIKE '%api.buymediamonds.co.uk%'
-- UNION ALL SELECT 'watch_videos.thumb', count(*) FROM watch_videos WHERE thumbnail_url LIKE '%api.buymediamonds.co.uk%'
-- UNION ALL SELECT 'chat_messages', count(*) FROM chat_messages WHERE attachment_url LIKE '%api.buymediamonds.co.uk%';

-- STEP 2 — apply the fix:
BEGIN;

UPDATE product_images       SET image_url     = REPLACE(image_url,     'api.buymediamonds.co.uk', 'api.mccullochjewellers.co.uk') WHERE image_url     LIKE '%api.buymediamonds.co.uk%';
UPDATE product_videos       SET video_url     = REPLACE(video_url,     'api.buymediamonds.co.uk', 'api.mccullochjewellers.co.uk') WHERE video_url     LIKE '%api.buymediamonds.co.uk%';
UPDATE product_videos       SET thumbnail_url = REPLACE(thumbnail_url, 'api.buymediamonds.co.uk', 'api.mccullochjewellers.co.uk') WHERE thumbnail_url LIKE '%api.buymediamonds.co.uk%';
UPDATE product_diamond_sizes SET video_url    = REPLACE(video_url,     'api.buymediamonds.co.uk', 'api.mccullochjewellers.co.uk') WHERE video_url     LIKE '%api.buymediamonds.co.uk%';
UPDATE categories           SET image_url     = REPLACE(image_url,     'api.buymediamonds.co.uk', 'api.mccullochjewellers.co.uk') WHERE image_url     LIKE '%api.buymediamonds.co.uk%';
UPDATE collections          SET image_url     = REPLACE(image_url,     'api.buymediamonds.co.uk', 'api.mccullochjewellers.co.uk') WHERE image_url     LIKE '%api.buymediamonds.co.uk%';
UPDATE promotions           SET image_url     = REPLACE(image_url,     'api.buymediamonds.co.uk', 'api.mccullochjewellers.co.uk') WHERE image_url     LIKE '%api.buymediamonds.co.uk%';
UPDATE marketing_content    SET video_url     = REPLACE(video_url,     'api.buymediamonds.co.uk', 'api.mccullochjewellers.co.uk') WHERE video_url     LIKE '%api.buymediamonds.co.uk%';
UPDATE watch_images         SET image_url     = REPLACE(image_url,     'api.buymediamonds.co.uk', 'api.mccullochjewellers.co.uk') WHERE image_url     LIKE '%api.buymediamonds.co.uk%';
UPDATE watch_videos         SET video_url     = REPLACE(video_url,     'api.buymediamonds.co.uk', 'api.mccullochjewellers.co.uk') WHERE video_url     LIKE '%api.buymediamonds.co.uk%';
UPDATE watch_videos         SET thumbnail_url = REPLACE(thumbnail_url, 'api.buymediamonds.co.uk', 'api.mccullochjewellers.co.uk') WHERE thumbnail_url LIKE '%api.buymediamonds.co.uk%';
UPDATE chat_messages        SET attachment_url= REPLACE(attachment_url,'api.buymediamonds.co.uk', 'api.mccullochjewellers.co.uk') WHERE attachment_url LIKE '%api.buymediamonds.co.uk%';

COMMIT;

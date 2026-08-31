-- 020_wedding_copy.sql
-- Real product copy from AlliedGold-Products.xlsx (Designs sheet): collection-based names
-- ("Papplewick 2mm Light"), display/SEO titles, and templated descriptions carrying
-- {metal}/{hallmark}/{metalNote} tokens so one description serves all 13 metals.

ALTER TABLE wedding_designs ADD COLUMN IF NOT EXISTS product_name         TEXT;
ALTER TABLE wedding_designs ADD COLUMN IF NOT EXISTS collection           TEXT;
ALTER TABLE wedding_designs ADD COLUMN IF NOT EXISTS subtitle             TEXT;
ALTER TABLE wedding_designs ADD COLUMN IF NOT EXISTS display_title        TEXT;
ALTER TABLE wedding_designs ADD COLUMN IF NOT EXISTS seo_name             TEXT;
ALTER TABLE wedding_designs ADD COLUMN IF NOT EXISTS short_description    TEXT;
ALTER TABLE wedding_designs ADD COLUMN IF NOT EXISTS description_template TEXT;
ALTER TABLE wedding_designs ADD COLUMN IF NOT EXISTS description_example  TEXT;
ALTER TABLE wedding_designs ADD COLUMN IF NOT EXISTS specification        TEXT;

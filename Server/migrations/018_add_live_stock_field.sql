-- Migration: Add live-stock flag to products table
-- Description: Marks a product as ready-made "live stock" (ready to ship), as opposed to
-- the made-to-order / configurable pieces. Drives the customer "Live Stock" facet and the
-- admin live-stock filter.

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_live_stock BOOLEAN DEFAULT FALSE;

-- Index for filtering live-stock products
CREATE INDEX IF NOT EXISTS idx_products_live_stock ON products(is_live_stock);

COMMENT ON COLUMN products.is_live_stock IS 'Whether this product is ready-made live stock (ready to ship)';

-- Backfill: the live-stock catalogue lives in the rings / earrings / necklaces categories
-- (the engagement-rings and wedding-rings categories are made-to-order). Flag every product
-- in those three categories as live stock.
UPDATE products p
SET is_live_stock = TRUE
FROM categories c
WHERE p.category_id = c.id
  AND c.slug IN ('rings', 'earrings', 'necklaces');

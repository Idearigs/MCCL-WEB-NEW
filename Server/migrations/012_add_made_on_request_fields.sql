-- Migration: Add Made on Request fields to products table
-- Description: Allows marking products as "made on request" with lead time info

-- Add made_on_request fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_made_on_request BOOLEAN DEFAULT FALSE;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS made_on_request_lead_time VARCHAR(100) DEFAULT '4-6 weeks';

ALTER TABLE products
ADD COLUMN IF NOT EXISTS made_on_request_message TEXT;

-- Add index for filtering made-on-request products
CREATE INDEX IF NOT EXISTS idx_products_made_on_request ON products(is_made_on_request);

-- Comment on columns
COMMENT ON COLUMN products.is_made_on_request IS 'Whether this product is made to order/request';
COMMENT ON COLUMN products.made_on_request_lead_time IS 'Expected lead time for made-on-request products (e.g., "4-6 weeks")';
COMMENT ON COLUMN products.made_on_request_message IS 'Custom message to display for made-on-request products';

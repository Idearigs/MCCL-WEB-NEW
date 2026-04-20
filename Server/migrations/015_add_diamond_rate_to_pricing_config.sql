-- Migration 015: Add diamond_rate_per_ct to product_pricing_config

ALTER TABLE product_pricing_config
  ADD COLUMN IF NOT EXISTS diamond_rate_per_ct DECIMAL(10,2) NOT NULL DEFAULT 2000.00;

-- Migration 014: Ring specs, side stones, and pricing config tables

-- Mount metal weights + center stone specs (one row per product)
CREATE TABLE IF NOT EXISTS product_ring_specs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Metal weights in grams
  silver_wt     DECIMAL(8,3),
  gold_9kt_wt   DECIMAL(8,3),
  gold_14kt_wt  DECIMAL(8,3),
  gold_18kt_wt  DECIMAL(8,3),
  platinum_wt   DECIMAL(8,3),

  -- Center stone 1
  cs1_shape     VARCHAR(50),
  cs1_size      VARCHAR(50),
  cs1_carats    DECIMAL(8,4),
  cs1_pieces    INTEGER,

  -- Center stone 2 (optional)
  cs2_shape     VARCHAR(50),
  cs2_size      VARCHAR(50),
  cs2_carats    DECIMAL(8,4),
  cs2_pieces    INTEGER,

  -- Metadata from Excel
  stone_shape   VARCHAR(50),
  stone_type    VARCHAR(50),
  ring_styles   TEXT,

  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(product_id)
);

-- Side stone line items (multiple rows per product)
CREATE TABLE IF NOT EXISTS product_side_stones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shape       VARCHAR(100),
  dimensions  VARCHAR(50),
  pieces      INTEGER,
  carats      DECIMAL(8,4),
  raw_entry   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_side_stones_product_id ON product_side_stones(product_id);

-- Pricing config + calculated results (one row per product)
CREATE TABLE IF NOT EXISTS product_pricing_config (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Cost inputs
  metal_premium_pct     DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  side_stone_rate_per_ct DECIMAL(8,2) NOT NULL DEFAULT 500.00,

  -- Margin
  margin_type           VARCHAR(10) NOT NULL DEFAULT 'percent',
  margin_value          DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Calculated results (JSONB, keyed by metal: silver/gold_9kt/gold_14kt/gold_18kt/platinum)
  calculated_prices     JSONB,
  last_calculated_at    TIMESTAMP,

  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(product_id)
);

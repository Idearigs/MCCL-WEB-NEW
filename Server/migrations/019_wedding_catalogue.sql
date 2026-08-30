-- 019_wedding_catalogue.sql
-- Allied Gold wedding-band catalogue (integration handover).
-- Dedicated tables — the catalogue is a designs + option-axes + price-lookup model
-- (never a flat 118k-variation table), served to the configurator. Kept separate from
-- `products` so the hardened checkout/pricing path is untouched.
--
-- Images key off (design, colourway), never per-SKU. 13 metals collapse to 3 colourways
-- (metal code ends Y→yellow, R→red, else white — PD/PT are white).

CREATE TABLE IF NOT EXISTS wedding_designs (
  design_id         TEXT PRIMARY KEY,
  category          TEXT NOT NULL,            -- Classic | Diamond Cut | Two Colour | Diamond Set | Shaped | Cluster
  design_name       TEXT NOT NULL,
  design_family     TEXT,
  description       TEXT,
  variations        INTEGER DEFAULT 0,        -- total variation count this design spans
  price_from        NUMERIC(10,2),
  price_to          NUMERIC(10,2),
  currency          TEXT DEFAULT 'GBP',
  pricing_model     TEXT,                     -- 'direct' (real product) | 'composed' (Classic base + surcharge)
  surcharge         NUMERIC(10,2),            -- flat pattern surcharge for composed designs
  width_mm          TEXT,                     -- fixed/measured width where applicable
  profile           TEXT,
  profile_code      TEXT,
  weight_class      TEXT,
  weight_class_id   TEXT,                     -- 8 ids, 4 names — key on id, never name
  series            TEXT,                     -- Ladies | Gents
  stone_shape       TEXT,
  setting_coverage  TEXT,
  colourways        TEXT,                     -- space list e.g. 'W Y R'
  hero_y            TEXT, hero_w  TEXT, hero_r  TEXT,   -- hero still per colourway (URL; source-res Azure or re-hosted 4x)
  hero_y_src        TEXT, hero_w_src TEXT, hero_r_src TEXT, -- original source-res Azure URL (fallback / provenance)
  spin_y            TEXT, spin_w  TEXT, spin_r  TEXT,   -- 360 frame template with {index}
  spin_frames       INTEGER,
  spin_start        INTEGER,
  extras            TEXT,                     -- extra still refs (raw)
  sort_order        INTEGER DEFAULT 0,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wedding_designs_category ON wedding_designs (category);

-- Allowed option values per design (drives the configurator's dimming of invalid choices).
CREATE TABLE IF NOT EXISTS wedding_design_options (
  design_id   TEXT NOT NULL REFERENCES wedding_designs(design_id) ON DELETE CASCADE,
  dimension   TEXT NOT NULL,   -- metal | profile | width | weight | quality | carat | origin | coverage | shape | collection | ...
  value       TEXT NOT NULL,
  label       TEXT
);
CREATE INDEX IF NOT EXISTS idx_wedding_options_design ON wedding_design_options (design_id);
CREATE INDEX IF NOT EXISTS idx_wedding_options_dim ON wedding_design_options (design_id, dimension);

-- Classic base-price grid, keyed on (width, profile, weight class). Prices per metal code.
CREATE TABLE IF NOT EXISTS wedding_price_matrix (
  width_mm     TEXT NOT NULL,
  profile      TEXT NOT NULL,
  weight_class TEXT NOT NULL,
  prices       JSONB NOT NULL,   -- { "18W": 705, "9Y": 308, ... } by metal code
  PRIMARY KEY (width_mm, profile, weight_class)
);

-- Direct-product variations (Classic, Diamond Set, Shaped, Cluster) — real SKU + price.
-- A price lookup, not a flat product table: the configurator reads it, never inserts variant rows.
CREATE TABLE IF NOT EXISTS wedding_variations (
  design_id      TEXT NOT NULL,
  category       TEXT,
  sku            TEXT,
  product_id     TEXT,
  product_code   TEXT,
  metal          TEXT,            -- catalogue metal code (18W, 9Y, PT, ...)
  metal_name     TEXT,
  hallmark       TEXT,
  colourway      TEXT,            -- Y | W | R (derived from metal code)
  width_mm       TEXT,
  profile        TEXT,
  weight_class   TEXT,
  series         TEXT,
  quality        TEXT,
  carat          TEXT,            -- string here (number only on Cluster) — kept as text
  stone_origin   TEXT,
  lab_grown      TEXT,            -- absent on Cluster: missing ≠ false
  metal_weight_g TEXT,
  price          NUMERIC(10,2),
  currency       TEXT DEFAULT 'GBP',
  hero           TEXT,
  spin           TEXT,
  spin_frames    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_wedding_variations_design ON wedding_variations (design_id);
CREATE INDEX IF NOT EXISTS idx_wedding_variations_sku ON wedding_variations (sku);

-- Composed price grid for Diamond Cut / Two Colour (Classic base + pattern surcharge).
-- retail_price = classic_price + surcharge, precomputed per metal/width/profile/weight.
CREATE TABLE IF NOT EXISTS wedding_pattern_prices (
  pattern_code    TEXT NOT NULL,   -- = design_id for the composed design
  category        TEXT,
  collection      TEXT,
  option_group    TEXT,
  metal           TEXT,
  metal_code      TEXT,
  metal_colour    TEXT,
  width_mm        TEXT,
  profile_code    TEXT,
  weight_class_id TEXT,
  base_sku        TEXT,
  classic_price   NUMERIC(10,2),
  retail_price    NUMERIC(10,2),
  surcharge       NUMERIC(10,2)
);
CREATE INDEX IF NOT EXISTS idx_wedding_pattern_code ON wedding_pattern_prices (pattern_code);
CREATE INDEX IF NOT EXISTS idx_wedding_pattern_lookup ON wedding_pattern_prices (pattern_code, metal_code, width_mm, profile_code, weight_class_id);

-- Shared option vocabularies + per-category availability (metal colour/stamp live here).
CREATE TABLE IF NOT EXISTS wedding_attributes (
  dimension    TEXT NOT NULL,
  value        TEXT NOT NULL,
  label        TEXT,
  code_id      TEXT,            -- source id (weight classes: key on this)
  colour       TEXT,            -- Y | W | R  (metal colourway)
  stamp        TEXT,            -- hallmark
  series       TEXT,
  availability JSONB,           -- { "Classic":"yes", "Diamond Set":"no", ... }
  PRIMARY KEY (dimension, value)
);

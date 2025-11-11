-- Add missing specification columns to watch_specifications table
-- Run this directly in your database tool or via psql

-- Case specifications
ALTER TABLE watch_specifications ADD COLUMN IF NOT EXISTS case_shape VARCHAR(100);
ALTER TABLE watch_specifications ADD COLUMN IF NOT EXISTS case_weight VARCHAR(50);

-- Dial specifications
ALTER TABLE watch_specifications ADD COLUMN IF NOT EXISTS dial_colour VARCHAR(100);
ALTER TABLE watch_specifications ADD COLUMN IF NOT EXISTS dial_crystal VARCHAR(100);
ALTER TABLE watch_specifications ADD COLUMN IF NOT EXISTS dial_hands_count VARCHAR(50);

-- Strap specifications
ALTER TABLE watch_specifications ADD COLUMN IF NOT EXISTS strap_width VARCHAR(50);

-- Movement specifications
ALTER TABLE watch_specifications ADD COLUMN IF NOT EXISTS movement_name VARCHAR(100);
ALTER TABLE watch_specifications ADD COLUMN IF NOT EXISTS movement_battery_type VARCHAR(100);
ALTER TABLE watch_specifications ADD COLUMN IF NOT EXISTS movement_manufacturing VARCHAR(255);

-- Features
ALTER TABLE watch_specifications ADD COLUMN IF NOT EXISTS additional_features TEXT;
ALTER TABLE watch_specifications ADD COLUMN IF NOT EXISTS watertightness VARCHAR(100);

-- Done! All columns added.

-- Migration 008: Separate Engagement and Wedding Ring Categories
-- This allows different subcategories for Engagement vs Wedding rings

-- =====================================================
-- 1. Add jewelry_sub_type_id to products table
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS jewelry_sub_type_id UUID REFERENCES jewelry_sub_types(id);

CREATE INDEX IF NOT EXISTS idx_products_jewelry_sub_type ON products(jewelry_sub_type_id);

-- =====================================================
-- 2. Create separate category linking tables
-- =====================================================

-- Link ring types to specific sub types (Engagement or Wedding)
CREATE TABLE IF NOT EXISTS jewelry_sub_type_ring_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jewelry_sub_type_id UUID NOT NULL REFERENCES jewelry_sub_types(id) ON DELETE CASCADE,
    ring_type_id UUID NOT NULL REFERENCES ring_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(jewelry_sub_type_id, ring_type_id)
);

CREATE INDEX idx_jewelry_sub_type_ring_types_sub_type ON jewelry_sub_type_ring_types(jewelry_sub_type_id);
CREATE INDEX idx_jewelry_sub_type_ring_types_ring_type ON jewelry_sub_type_ring_types(ring_type_id);

-- Link gemstones to specific sub types (shared by default, but can be customized)
CREATE TABLE IF NOT EXISTS jewelry_sub_type_gemstones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jewelry_sub_type_id UUID NOT NULL REFERENCES jewelry_sub_types(id) ON DELETE CASCADE,
    gemstone_id UUID NOT NULL REFERENCES gemstones(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(jewelry_sub_type_id, gemstone_id)
);

CREATE INDEX idx_jewelry_sub_type_gemstones_sub_type ON jewelry_sub_type_gemstones(jewelry_sub_type_id);
CREATE INDEX idx_jewelry_sub_type_gemstones_gemstone ON jewelry_sub_type_gemstones(gemstone_id);

-- Link metals to specific sub types (shared by default, but can be customized)
CREATE TABLE IF NOT EXISTS jewelry_sub_type_metals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jewelry_sub_type_id UUID NOT NULL REFERENCES jewelry_sub_types(id) ON DELETE CASCADE,
    metal_id UUID NOT NULL REFERENCES product_metals(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(jewelry_sub_type_id, metal_id)
);

CREATE INDEX idx_jewelry_sub_type_metals_sub_type ON jewelry_sub_type_metals(jewelry_sub_type_id);
CREATE INDEX idx_jewelry_sub_type_metals_metal ON jewelry_sub_type_metals(metal_id);

-- Link collections to specific sub types
CREATE TABLE IF NOT EXISTS jewelry_sub_type_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jewelry_sub_type_id UUID NOT NULL REFERENCES jewelry_sub_types(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(jewelry_sub_type_id, collection_id)
);

CREATE INDEX idx_jewelry_sub_type_collections_sub_type ON jewelry_sub_type_collections(jewelry_sub_type_id);
CREATE INDEX idx_jewelry_sub_type_collections_collection ON jewelry_sub_type_collections(collection_id);

-- =====================================================
-- 3. Link ALL existing ring types, gemstones, metals, and collections to BOTH Engagement and Wedding
-- =====================================================

-- Get the IDs for Engagement and Wedding
DO $$
DECLARE
    engagement_id UUID;
    wedding_id UUID;
BEGIN
    -- Get Engagement Rings ID
    SELECT id INTO engagement_id FROM jewelry_sub_types WHERE slug = 'engagement-rings' LIMIT 1;

    -- Get Wedding Rings ID
    SELECT id INTO wedding_id FROM jewelry_sub_types WHERE slug = 'wedding-rings' LIMIT 1;

    -- Link all ring types to both Engagement and Wedding
    IF engagement_id IS NOT NULL THEN
        INSERT INTO jewelry_sub_type_ring_types (jewelry_sub_type_id, ring_type_id)
        SELECT engagement_id, id FROM ring_types WHERE is_active = true
        ON CONFLICT (jewelry_sub_type_id, ring_type_id) DO NOTHING;
    END IF;

    IF wedding_id IS NOT NULL THEN
        INSERT INTO jewelry_sub_type_ring_types (jewelry_sub_type_id, ring_type_id)
        SELECT wedding_id, id FROM ring_types WHERE is_active = true
        ON CONFLICT (jewelry_sub_type_id, ring_type_id) DO NOTHING;
    END IF;

    -- Link all gemstones to both Engagement and Wedding
    IF engagement_id IS NOT NULL THEN
        INSERT INTO jewelry_sub_type_gemstones (jewelry_sub_type_id, gemstone_id)
        SELECT engagement_id, id FROM gemstones WHERE is_active = true
        ON CONFLICT (jewelry_sub_type_id, gemstone_id) DO NOTHING;
    END IF;

    IF wedding_id IS NOT NULL THEN
        INSERT INTO jewelry_sub_type_gemstones (jewelry_sub_type_id, gemstone_id)
        SELECT wedding_id, id FROM gemstones WHERE is_active = true
        ON CONFLICT (jewelry_sub_type_id, gemstone_id) DO NOTHING;
    END IF;

    -- Link all metals to both Engagement and Wedding
    IF engagement_id IS NOT NULL THEN
        INSERT INTO jewelry_sub_type_metals (jewelry_sub_type_id, metal_id)
        SELECT engagement_id, id FROM product_metals WHERE is_active = true
        ON CONFLICT (jewelry_sub_type_id, metal_id) DO NOTHING;
    END IF;

    IF wedding_id IS NOT NULL THEN
        INSERT INTO jewelry_sub_type_metals (jewelry_sub_type_id, metal_id)
        SELECT wedding_id, id FROM product_metals WHERE is_active = true
        ON CONFLICT (jewelry_sub_type_id, metal_id) DO NOTHING;
    END IF;

    -- Link all collections to both Engagement and Wedding
    IF engagement_id IS NOT NULL THEN
        INSERT INTO jewelry_sub_type_collections (jewelry_sub_type_id, collection_id)
        SELECT engagement_id, id FROM collections WHERE is_active = true
        ON CONFLICT (jewelry_sub_type_id, collection_id) DO NOTHING;
    END IF;

    IF wedding_id IS NOT NULL THEN
        INSERT INTO jewelry_sub_type_collections (jewelry_sub_type_id, collection_id)
        SELECT wedding_id, id FROM collections WHERE is_active = true
        ON CONFLICT (jewelry_sub_type_id, collection_id) DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- 4. Create triggers for updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_jewelry_sub_type_ring_types_updated_at ON jewelry_sub_type_ring_types;
CREATE TRIGGER update_jewelry_sub_type_ring_types_updated_at
    BEFORE UPDATE ON jewelry_sub_type_ring_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jewelry_sub_type_gemstones_updated_at ON jewelry_sub_type_gemstones;
CREATE TRIGGER update_jewelry_sub_type_gemstones_updated_at
    BEFORE UPDATE ON jewelry_sub_type_gemstones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jewelry_sub_type_metals_updated_at ON jewelry_sub_type_metals;
CREATE TRIGGER update_jewelry_sub_type_metals_updated_at
    BEFORE UPDATE ON jewelry_sub_type_metals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jewelry_sub_type_collections_updated_at ON jewelry_sub_type_collections;
CREATE TRIGGER update_jewelry_sub_type_collections_updated_at
    BEFORE UPDATE ON jewelry_sub_type_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Migration Complete
-- =====================================================
-- Now Engagement and Wedding rings can have separate:
-- - Ring Types
-- - Gemstones
-- - Metals
-- - Collections
--
-- Initially, both share the same items
-- Admins can customize by adding/removing items from jewelry_sub_type_* tables

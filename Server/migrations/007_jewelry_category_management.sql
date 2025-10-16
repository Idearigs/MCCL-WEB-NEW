-- Migration 007: Jewelry Category Management System
-- This migration creates a hierarchical jewelry category structure
-- Allows separate management of Engagement Rings, Wedding Rings, Earrings, Necklaces, and Bracelets

-- =====================================================
-- 1. Create JewelryTypes Table (Main Jewelry Categories)
-- =====================================================
CREATE TABLE IF NOT EXISTS jewelry_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- Icon name for UI display
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jewelry_types_slug ON jewelry_types(slug);
CREATE INDEX idx_jewelry_types_active ON jewelry_types(is_active);

-- =====================================================
-- 2. Create JewelrySubTypes Table (Engagement, Wedding, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS jewelry_sub_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jewelry_type_id UUID NOT NULL REFERENCES jewelry_types(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(jewelry_type_id, name)
);

CREATE INDEX idx_jewelry_sub_types_type ON jewelry_sub_types(jewelry_type_id);
CREATE INDEX idx_jewelry_sub_types_slug ON jewelry_sub_types(slug);
CREATE INDEX idx_jewelry_sub_types_active ON jewelry_sub_types(is_active);

-- =====================================================
-- 3. Create EarringTypes Table (Studs, Hoops, Drops, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS earring_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_earring_types_slug ON earring_types(slug);
CREATE INDEX idx_earring_types_active ON earring_types(is_active);

-- =====================================================
-- 4. Create NecklaceTypes Table (Pendants, Chains, Chokers, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS necklace_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_necklace_types_slug ON necklace_types(slug);
CREATE INDEX idx_necklace_types_active ON necklace_types(is_active);

-- =====================================================
-- 5. Create BraceletTypes Table (Bangles, Chains, Cuffs, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS bracelet_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bracelet_types_slug ON bracelet_types(slug);
CREATE INDEX idx_bracelet_types_active ON bracelet_types(is_active);

-- =====================================================
-- 6. Add new columns to Products table for new jewelry types
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS jewelry_type_id UUID REFERENCES jewelry_types(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS jewelry_sub_type_id UUID REFERENCES jewelry_sub_types(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS earring_type_id UUID REFERENCES earring_types(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS necklace_type_id UUID REFERENCES necklace_types(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS bracelet_type_id UUID REFERENCES bracelet_types(id);

CREATE INDEX IF NOT EXISTS idx_products_jewelry_type ON products(jewelry_type_id);
CREATE INDEX IF NOT EXISTS idx_products_jewelry_sub_type ON products(jewelry_sub_type_id);
CREATE INDEX IF NOT EXISTS idx_products_earring_type ON products(earring_type_id);
CREATE INDEX IF NOT EXISTS idx_products_necklace_type ON products(necklace_type_id);
CREATE INDEX IF NOT EXISTS idx_products_bracelet_type ON products(bracelet_type_id);

-- =====================================================
-- 7. Seed Initial Jewelry Types
-- =====================================================
INSERT INTO jewelry_types (name, slug, description, icon, sort_order) VALUES
    ('Rings', 'rings', 'Browse our collection of exquisite rings', 'Circle', 0),
    ('Earrings', 'earrings', 'Discover our elegant earrings collection', 'Sparkles', 1),
    ('Necklaces', 'necklaces', 'Explore our stunning necklace designs', 'Link', 2),
    ('Bracelets', 'bracelets', 'View our beautiful bracelet selection', 'Watch', 3)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 8. Seed Initial Jewelry Sub Types (Engagement & Wedding Rings)
-- =====================================================
INSERT INTO jewelry_sub_types (jewelry_type_id, name, slug, description, sort_order)
SELECT
    jt.id,
    'Engagement Rings',
    'engagement-rings',
    'Celebrate your love with our stunning engagement ring collection',
    0
FROM jewelry_types jt WHERE jt.slug = 'rings'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO jewelry_sub_types (jewelry_type_id, name, slug, description, sort_order)
SELECT
    jt.id,
    'Wedding Rings',
    'wedding-rings',
    'Timeless wedding bands to symbolize your eternal commitment',
    1
FROM jewelry_types jt WHERE jt.slug = 'rings'
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 9. Seed Earring Types
-- =====================================================
INSERT INTO earring_types (name, slug, description, sort_order) VALUES
    ('Stud Earrings', 'stud-earrings', 'Classic and versatile stud earrings', 0),
    ('Hoop Earrings', 'hoop-earrings', 'Elegant hoop earrings in various sizes', 1),
    ('Drop Earrings', 'drop-earrings', 'Graceful drop earrings with movement', 2),
    ('Chandelier Earrings', 'chandelier-earrings', 'Statement chandelier earrings', 3),
    ('Huggie Earrings', 'huggie-earrings', 'Small hoops that hug the earlobe', 4),
    ('Cluster Earrings', 'cluster-earrings', 'Earrings with clustered gemstones', 5)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 10. Seed Necklace Types
-- =====================================================
INSERT INTO necklace_types (name, slug, description, sort_order) VALUES
    ('Pendant Necklaces', 'pendant-necklaces', 'Beautiful pendant necklaces', 0),
    ('Chain Necklaces', 'chain-necklaces', 'Elegant chain necklaces', 1),
    ('Choker Necklaces', 'choker-necklaces', 'Stylish choker designs', 2),
    ('Lariat Necklaces', 'lariat-necklaces', 'Modern lariat style necklaces', 3),
    ('Statement Necklaces', 'statement-necklaces', 'Bold statement pieces', 4),
    ('Layered Necklaces', 'layered-necklaces', 'Multi-strand layered designs', 5)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 11. Seed Bracelet Types
-- =====================================================
INSERT INTO bracelet_types (name, slug, description, sort_order) VALUES
    ('Bangle Bracelets', 'bangle-bracelets', 'Elegant bangle bracelets', 0),
    ('Chain Bracelets', 'chain-bracelets', 'Classic chain bracelet designs', 1),
    ('Cuff Bracelets', 'cuff-bracelets', 'Statement cuff bracelets', 2),
    ('Tennis Bracelets', 'tennis-bracelets', 'Timeless tennis bracelets', 3),
    ('Charm Bracelets', 'charm-bracelets', 'Personalized charm bracelets', 4),
    ('Beaded Bracelets', 'beaded-bracelets', 'Beautiful beaded designs', 5)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 12. Create Triggers for updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_jewelry_types_updated_at ON jewelry_types;
CREATE TRIGGER update_jewelry_types_updated_at
    BEFORE UPDATE ON jewelry_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jewelry_sub_types_updated_at ON jewelry_sub_types;
CREATE TRIGGER update_jewelry_sub_types_updated_at
    BEFORE UPDATE ON jewelry_sub_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_earring_types_updated_at ON earring_types;
CREATE TRIGGER update_earring_types_updated_at
    BEFORE UPDATE ON earring_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_necklace_types_updated_at ON necklace_types;
CREATE TRIGGER update_necklace_types_updated_at
    BEFORE UPDATE ON necklace_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bracelet_types_updated_at ON bracelet_types;
CREATE TRIGGER update_bracelet_types_updated_at
    BEFORE UPDATE ON bracelet_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Migration Complete
-- =====================================================
-- This migration creates:
-- - jewelry_types: Main categories (Rings, Earrings, Necklaces, Bracelets)
-- - jewelry_sub_types: Ring subcategories (Engagement, Wedding)
-- - earring_types: Types of earrings (Studs, Hoops, Drops, etc.)
-- - necklace_types: Types of necklaces (Pendants, Chains, Chokers, etc.)
-- - bracelet_types: Types of bracelets (Bangles, Chains, Cuffs, etc.)
--
-- Existing tables (ring_types, gemstones, product_metals, collections) remain unchanged
-- and can be used universally across all jewelry types

-- Create junction tables for many-to-many relationships between products and categories

-- Product Ring Types relationship
CREATE TABLE IF NOT EXISTS product_ring_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ring_type_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, ring_type_id)
);

-- Product Gemstones relationship
CREATE TABLE IF NOT EXISTS product_gemstones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    gemstone_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, gemstone_id)
);

-- Product Metals relationship
CREATE TABLE IF NOT EXISTS product_metals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    metal_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, metal_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_ring_types_product_id ON product_ring_types(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ring_types_ring_type_id ON product_ring_types(ring_type_id);

CREATE INDEX IF NOT EXISTS idx_product_gemstones_product_id ON product_gemstones(product_id);
CREATE INDEX IF NOT EXISTS idx_product_gemstones_gemstone_id ON product_gemstones(gemstone_id);

CREATE INDEX IF NOT EXISTS idx_product_metals_product_id ON product_metals(product_id);
CREATE INDEX IF NOT EXISTS idx_product_metals_metal_id ON product_metals(metal_id);

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_product_ring_types_updated_at BEFORE UPDATE ON product_ring_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_gemstones_updated_at BEFORE UPDATE ON product_gemstones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_metals_updated_at BEFORE UPDATE ON product_metals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
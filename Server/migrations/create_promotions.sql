-- Create promotions table
CREATE TABLE IF NOT EXISTS "promotions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "product_id" UUID REFERENCES "products"("id") ON DELETE SET NULL,
  "discount_percentage" INTEGER,
  "banner_text" VARCHAR(500),
  "image_url" VARCHAR(500),
  "is_active" BOOLEAN DEFAULT true,
  "show_popup" BOOLEAN DEFAULT true,
  "show_banner" BOOLEAN DEFAULT true,
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_promotions_is_active" ON "promotions"("is_active");
CREATE INDEX IF NOT EXISTS "idx_promotions_show_popup" ON "promotions"("show_popup");
CREATE INDEX IF NOT EXISTS "idx_promotions_show_banner" ON "promotions"("show_banner");
CREATE INDEX IF NOT EXISTS "idx_promotions_sort_order" ON "promotions"("sort_order");

-- Verify table was created
SELECT * FROM information_schema.tables WHERE table_name = 'promotions';

-- Create reviews table (customer testimonials: admin-added + visitor-submitted)
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "author_name" VARCHAR(120) NOT NULL,
  "location" VARCHAR(120),
  "category" VARCHAR(60),
  "rating" INTEGER NOT NULL DEFAULT 5,
  "body" TEXT NOT NULL,
  "email" VARCHAR(255),
  "source" VARCHAR(20) NOT NULL DEFAULT 'admin',   -- admin | visitor
  "status" VARCHAR(20) NOT NULL DEFAULT 'published', -- pending | published | hidden
  "is_featured" BOOLEAN DEFAULT false,             -- show in homepage "What clients say"
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_reviews_status" ON "reviews"("status");
CREATE INDEX IF NOT EXISTS "idx_reviews_source" ON "reviews"("source");
CREATE INDEX IF NOT EXISTS "idx_reviews_is_featured" ON "reviews"("is_featured");
CREATE INDEX IF NOT EXISTS "idx_reviews_sort_order" ON "reviews"("sort_order");

-- Seed with the three original hardcoded homepage testimonials (published + featured)
INSERT INTO "reviews" ("author_name", "category", "rating", "body", "source", "status", "is_featured", "sort_order")
SELECT * FROM (VALUES
  ('Hannah W.', 'Bespoke', 5, 'They redesigned my grandmother''s ring around a stone I already had. It came back better than the original.', 'admin', 'published', true, 0),
  ('Daniel R.', 'Engagement', 5, 'No pressure, no upselling. We spent an hour looking at stones and left knowing what we were paying for.', 'admin', 'published', true, 1),
  ('Priya S.', 'Servicing', 5, 'Resized and rhodium-plated in two days while I waited nearby. Hard to find that kind of service now.', 'admin', 'published', true, 2)
) AS seed(author_name, category, rating, body, source, status, is_featured, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM "reviews");

-- Verify
SELECT * FROM information_schema.tables WHERE table_name = 'reviews';

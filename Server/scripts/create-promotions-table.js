const { postgresDB } = require('../config/database');

const createPromotionsTable = async () => {
  const sequelize = postgresDB();

  if (!sequelize) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  try {
    console.log('Creating promotions table...');

    await sequelize.query(`
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
    `);

    console.log('✅ Promotions table created successfully!');

    // Create indexes
    await sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_promotions_is_active" ON "promotions"("is_active");`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_promotions_show_popup" ON "promotions"("show_popup");`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_promotions_show_banner" ON "promotions"("show_banner");`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_promotions_sort_order" ON "promotions"("sort_order");`);

    console.log('✅ Indexes created successfully!');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating table:', error.message);
    process.exit(1);
  }
};

createPromotionsTable();

const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const sequelize = new Sequelize({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'mcculloch_db',
  username: process.env.PG_USERNAME || 'postgres',
  password: process.env.PG_PASSWORD,
  dialect: 'postgres',
  logging: console.log
});

async function checkMetalImages() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection successful!\n');

    // Get the most recent products with images
    const results = await sequelize.query(`
      SELECT
        p.id,
        p.name,
        COUNT(pi.id) as total_images,
        COUNT(pi.metal_id) as images_with_metal_id,
        SUM(CASE WHEN pi.metal_id IS NULL THEN 1 ELSE 0 END) as images_without_metal_id
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id)
      GROUP BY p.id, p.name
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    console.log('Recent products with images:');
    console.log(results[0]);
    console.log('\n');

    if (results[0].length > 0) {
      const latestProduct = results[0][0];
      console.log(`\nDetailed check for product: ${latestProduct.name} (${latestProduct.id})`);
      console.log(`Total images: ${latestProduct.total_images}`);
      console.log(`Images with metal_id: ${latestProduct.images_with_metal_id}`);
      console.log(`Images without metal_id (NULL): ${latestProduct.images_without_metal_id}`);

      // Get detailed image data
      const imageDetails = await sequelize.query(`
        SELECT
          id,
          product_id,
          metal_id,
          image_url,
          is_primary,
          sort_order,
          created_at
        FROM product_images
        WHERE product_id = '${latestProduct.id}'
        ORDER BY sort_order ASC
      `);

      console.log('\nDetailed image records:');
      imageDetails[0].forEach((img, index) => {
        console.log(`\n[Image ${index + 1}]`);
        console.log(`  ID: ${img.id}`);
        console.log(`  Metal ID: ${img.metal_id || 'NULL'}`);
        console.log(`  URL: ${img.image_url}`);
        console.log(`  Is Primary: ${img.is_primary}`);
        console.log(`  Sort Order: ${img.sort_order}`);
      });

      // Check if any metals are associated with this product
      const metalCheck = await sequelize.query(`
        SELECT
          pm.id,
          pm.name,
          COUNT(pi.id) as image_count
        FROM product_metals pm
        LEFT JOIN product_images pi ON pm.id = pi.metal_id
        WHERE pi.product_id = '${latestProduct.id}'
        GROUP BY pm.id, pm.name
      `);

      if (metalCheck[0].length > 0) {
        console.log('\n\nMetals with images for this product:');
        metalCheck[0].forEach(metal => {
          console.log(`  - ${metal.name} (${metal.id}): ${metal.image_count} images`);
        });
      } else {
        console.log('\n\nNo metal-specific images found for this product.');
      }
    }

    // Also check the junction table to see available metals for the product
    if (results[0].length > 0) {
      const latestProduct = results[0][0];
      const metalJunction = await sequelize.query(`
        SELECT
          pm.id,
          pm.name,
          pm.color_code
        FROM product_metals_junction pmj
        JOIN product_metals pm ON pmj.metal_id = pm.id
        WHERE pmj.product_id = '${latestProduct.id}'
        ORDER BY pm.sort_order ASC
      `);

      console.log('\n\nMetals available for this product (from junction table):');
      if (metalJunction[0].length > 0) {
        metalJunction[0].forEach(metal => {
          console.log(`  - ${metal.name} (${metal.id}): ${metal.color_code}`);
        });
      } else {
        console.log('  No metals associated with this product');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkMetalImages();

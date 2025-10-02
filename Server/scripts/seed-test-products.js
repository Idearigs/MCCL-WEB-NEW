// File: scripts/seed-test-products.js
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config');
const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');

// Function to generate slug from name
function generateSlug(name) {
  return slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
}

async function seedTestProducts() {
  const sequelize = new Sequelize(
    config.database.postgres.database,
    config.database.postgres.username,
    config.database.postgres.password,
    {
      host: config.database.postgres.host,
      port: config.database.postgres.port,
      dialect: 'postgres',
      logging: console.log,
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to the database');

    // Sample data
    const testProducts = [
      {
        name: 'Diamond Solitaire Ring',
        description: 'Beautiful 1.0 carat diamond solitaire ring in 14K white gold',
        base_price: 1999.99,
        sku: 'DSR-001-WG',
        category_id: '2ec02dbd-9c75-402f-a9b4-ba33a30ccbcd', // Rings category
        collection_id: (await sequelize.query('SELECT id FROM collections LIMIT 1'))[0][0].id,
        gemstone_id: (await sequelize.query('SELECT id FROM gemstones WHERE name ILIKE \'%diamond%\' LIMIT 1'))[0][0]?.id,
        ring_type_id: (await sequelize.query('SELECT id FROM ring_types LIMIT 1'))[0][0].id,
        is_active: true,
        images: [
          { image_url: 'https://example.com/rings/solitaire-1.jpg', is_primary: true },
          { image_url: 'https://example.com/rings/solitaire-2.jpg' }
        ]
      },
      {
        name: 'Sapphire Halo Ring',
        description: 'Elegant blue sapphire halo ring with diamond accents in 14K yellow gold',
        base_price: 1499.99,
        sku: 'SHR-002-YG',
        category_id: '2ec02dbd-9c75-402f-a9b4-ba33a30ccbcd', // Rings category
        collection_id: (await sequelize.query('SELECT id FROM collections LIMIT 1'))[0][0].id,
        gemstone_id: (await sequelize.query('SELECT id FROM gemstones WHERE name ILIKE \'%sapphire%\' LIMIT 1'))[0][0]?.id,
        ring_type_id: (await sequelize.query('SELECT id FROM ring_types LIMIT 1'))[0][0].id,
        is_active: true,
        images: [
          { image_url: 'https://example.com/rings/sapphire-1.jpg', is_primary: true },
          { image_url: 'https://example.com/rings/sapphire-2.jpg' }
        ]
      }
    ];

    console.log('🌱 Seeding test products...');
    
    for (const productData of testProducts) {
      const { images, ...product } = productData;
      const slug = generateSlug(product.name);
      
      // Check if product with this slug already exists
      const [existingProduct] = await sequelize.query(`
        SELECT id FROM products WHERE slug = '${slug}'
      `);

      if (existingProduct.length > 0) {
        console.log(`ℹ️  Product with slug '${slug}' already exists, skipping...`);
        continue;
      }

      const productId = uuidv4();
      
      // Create product
      await sequelize.query(`
        INSERT INTO products (
          id, name, slug, description, base_price, sku, 
          category_id, collection_id, gemstone_id, ring_type_id, 
          is_active, created_at, updated_at
        ) VALUES (
          '${productId}',
          '${product.name.replace(/'/g, "''")}',
          '${slug}',
          '${product.description.replace(/'/g, "''")}',
          ${product.base_price},
          '${product.sku}',
          '${product.category_id}',
          '${product.collection_id}',
          ${product.gemstone_id ? `'${product.gemstone_id}'` : 'NULL'},
          '${product.ring_type_id}',
          ${product.is_active},
          NOW(),
          NOW()
        )
      `);

      // Add product images
      for (const [index, image] of images.entries()) {
        await sequelize.query(`
          INSERT INTO product_images (id, product_id, image_url, is_primary, sort_order, created_at, updated_at)
          VALUES (
            '${uuidv4()}',
            '${productId}',
            '${image.image_url}',
            ${image.is_primary || false},
            ${index},
            NOW(),
            NOW()
          )
        `);
      }

      console.log(`✅ Added product: ${product.name} (${slug})`);
    }

    console.log('\n🎉 Successfully seeded test products!');
    console.log('You can now check your admin panel to see the test products.');

  } catch (error) {
    console.error('❌ Error seeding test products:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seeder
seedTestProducts();
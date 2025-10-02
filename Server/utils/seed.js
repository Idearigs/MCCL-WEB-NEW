const { connectDatabases } = require('../config/database');
const { initializeModels, getModels } = require('../models');

const seedData = async () => {
  try {
    await connectDatabases();
    initializeModels();

    const { Category, Collection, Product, ProductImage, ProductVariant, ProductMetals, ProductSizes } = getModels();

    console.log('🌱 Starting database seed...');

    // Clear existing data
    await ProductVariant.destroy({ where: {} });
    await ProductImage.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await ProductSizes.destroy({ where: {} });
    await ProductMetals.destroy({ where: {} });
    await Collection.destroy({ where: {} });
    await Category.destroy({ where: {} });

    // Create Categories
    const categories = await Category.bulkCreate([
      {
        name: 'Rings',
        slug: 'rings',
        description: 'Exquisite rings including engagement rings, wedding bands, and statement pieces',
        image_url: '/images/rings-category.jpg',
        sort_order: 1
      },
      {
        name: 'Earrings',
        slug: 'earrings',
        description: 'Beautiful earrings from classic studs to statement drops',
        image_url: '/images/earrings-category.jpg',
        sort_order: 2
      },
      {
        name: 'Necklaces',
        slug: 'necklaces',
        description: 'Elegant necklaces and pendants for every occasion',
        image_url: '/images/necklaces-category.jpg',
        sort_order: 3
      },
      {
        name: 'Bracelets',
        slug: 'bracelets',
        description: 'Stunning bracelets and bangles to complete your look',
        image_url: '/images/bracelets-category.jpg',
        sort_order: 4
      }
    ]);

    console.log('✅ Categories created');

    // Create Collections
    const collections = await Collection.bulkCreate([
      {
        name: 'Heritage Collection',
        slug: 'heritage-collection',
        description: 'Timeless pieces inspired by classic jewelry craftsmanship',
        is_featured: true,
        sort_order: 1
      },
      {
        name: 'Royal Collection',
        slug: 'royal-collection',
        description: 'Luxurious pieces fit for royalty',
        is_featured: true,
        sort_order: 2
      },
      {
        name: 'Signature Collection',
        slug: 'signature-collection',
        description: 'Our signature designs that define McCulloch style',
        is_featured: false,
        sort_order: 3
      },
      {
        name: 'Bespoke Collection',
        slug: 'bespoke-collection',
        description: 'Custom-made pieces crafted to your specifications',
        is_featured: false,
        sort_order: 4
      },
      {
        name: 'Limited Edition',
        slug: 'limited-edition',
        description: 'Exclusive limited edition pieces',
        is_featured: true,
        sort_order: 5
      },
      {
        name: 'Vintage Collection',
        slug: 'vintage-collection',
        description: 'Carefully curated vintage and antique pieces',
        is_featured: false,
        sort_order: 6
      }
    ]);

    console.log('✅ Collections created');

    // Create Product Metals
    await ProductMetals.bulkCreate([
      {
        name: 'Platinum',
        color_code: '#E5E4E2',
        price_multiplier: 1.0000,
        sort_order: 1
      },
      {
        name: 'White Gold',
        color_code: '#F8F8FF',
        price_multiplier: 0.8000,
        sort_order: 2
      },
      {
        name: 'Yellow Gold',
        color_code: '#FFD700',
        price_multiplier: 0.7500,
        sort_order: 3
      },
      {
        name: 'Rose Gold',
        color_code: '#E8B4B8',
        price_multiplier: 0.7500,
        sort_order: 4
      },
      {
        name: 'Sterling Silver',
        color_code: '#C0C0C0',
        price_multiplier: 0.3000,
        sort_order: 5
      },
      {
        name: 'Palladium',
        color_code: '#CED0DD',
        price_multiplier: 0.9000,
        sort_order: 6
      }
    ]);

    console.log('✅ Product metals created');

    // Create Ring Sizes
    await ProductSizes.bulkCreate([
      ...['H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'].map((size, index) => ({
        size_name: size,
        size_value: size,
        category_id: categories[0].id, // Rings category
        sort_order: index + 1
      }))
    ]);

    console.log('✅ Ring sizes created');

    // Create Products based on your frontend examples
    const productsData = [
      {
        name: 'The National Gallery Play of Light Platinum Ring',
        slug: 'ashoka-five-stone-platinum-diamond-eternity-ring',
        description: 'Renowned for their brilliance and inner fire, Ashoka diamonds are some of the rarest in the world; less than two percent of diamonds mined can be cut in this way. From Rosalies, a magnificent five stone Ashoka cut eternity ring in a platinum setting that showcases the exceptional fire and brilliance of these extraordinary diamonds.',
        short_description: 'Magnificent five stone Ashoka cut eternity ring in platinum with exceptional diamond brilliance.',
        sku: 'MCR-ASH-001',
        base_price: 12500.00,
        currency: 'GBP',
        is_featured: true,
        in_stock: true,
        stock_quantity: 3,
        weight: 8.5,
        care_instructions: 'Clean with warm soapy water and soft brush. Professional cleaning recommended annually.',
        warranty_info: 'Lifetime warranty on craftsmanship. International warranty honored.',
        meta_title: 'Ashoka Five Stone Platinum Diamond Eternity Ring | McCulloch Jewellers',
        meta_description: 'Exquisite Ashoka diamond eternity ring in platinum. Rare cut diamonds with exceptional brilliance. Lifetime warranty included.',
        category_id: categories[0].id, // Rings
        collection_id: collections[1].id // Royal Collection
      },
      {
        name: 'Raindance Classic Platinum Diamond Ring',
        slug: 'raindance-classic-platinum-diamond-ring',
        description: 'A stunning classic design featuring brilliant cut diamonds in a platinum setting. This timeless piece exemplifies traditional craftsmanship with modern precision.',
        short_description: 'Classic brilliant cut diamond ring in platinum setting.',
        sku: 'MCR-RDC-001',
        base_price: 11000.00,
        currency: 'GBP',
        is_featured: true,
        in_stock: true,
        stock_quantity: 5,
        category_id: categories[0].id,
        collection_id: collections[0].id // Heritage Collection
      },
      {
        name: 'Eternity Wedding Band',
        slug: 'eternity-wedding-band',
        description: 'A continuous circle of diamonds symbolizing eternal love. Perfect as a wedding band or anniversary gift.',
        short_description: 'Continuous diamond eternity band in precious metal.',
        sku: 'MCR-EWB-001',
        base_price: 1650.00,
        currency: 'GBP',
        is_featured: false,
        in_stock: true,
        stock_quantity: 8,
        category_id: categories[0].id,
        collection_id: collections[2].id // Signature Collection
      },
      {
        name: 'Diamond Tennis Necklace',
        slug: 'diamond-tennis-necklace',
        description: 'Elegant tennis necklace featuring graduated diamonds. A versatile piece suitable for both day and evening wear.',
        short_description: 'Elegant diamond tennis necklace with graduated stones.',
        sku: 'MCN-DTN-001',
        base_price: 4200.00,
        currency: 'GBP',
        is_featured: true,
        in_stock: true,
        stock_quantity: 4,
        category_id: categories[2].id, // Necklaces
        collection_id: collections[0].id
      },
      {
        name: 'Pearl Drop Earrings',
        slug: 'pearl-drop-earrings',
        description: 'Sophisticated pearl drop earrings with diamond accents. These elegant pieces add grace to any ensemble.',
        short_description: 'Sophisticated pearl drops with diamond accents.',
        sku: 'MCE-PDE-001',
        base_price: 850.00,
        currency: 'GBP',
        is_featured: false,
        in_stock: true,
        stock_quantity: 6,
        category_id: categories[1].id, // Earrings
        collection_id: collections[0].id
      },
      {
        name: 'Luxury Timepiece',
        slug: 'luxury-timepiece',
        description: 'Exceptional timepiece combining traditional watchmaking with contemporary design elements.',
        short_description: 'Exceptional timepiece with contemporary design.',
        sku: 'MCW-LTP-001',
        base_price: 8500.00,
        currency: 'GBP',
        is_featured: true,
        in_stock: true,
        stock_quantity: 2,
        category_id: categories[3].id, // Using bracelets category for watches
        collection_id: collections[4].id // Limited Edition
      }
    ];

    const products = [];
    for (const productData of productsData) {
      const product = await Product.create(productData);
      products.push(product);
    }

    console.log('✅ Products created');

    // Create Product Images
    const imageData = [
      // Ashoka Ring Images
      { product_id: products[0].id, image_url: '/images/Screenshot 2025-08-08 190135.png', alt_text: 'Ashoka Diamond Ring Front View', is_primary: true, sort_order: 1 },
      { product_id: products[0].id, image_url: '/images/Screenshot 2025-08-08 190223.png', alt_text: 'Ashoka Diamond Ring Side View', is_primary: false, sort_order: 2 },
      { product_id: products[0].id, image_url: '/images/Screenshot 2025-08-08 190300.png', alt_text: 'Ashoka Diamond Ring Detail View', is_primary: false, sort_order: 3 },

      // Raindance Ring Images
      { product_id: products[1].id, image_url: '/images/Engagement.png', alt_text: 'Raindance Classic Ring', is_primary: true, sort_order: 1 },
      { product_id: products[1].id, image_url: '/images/Wedding.jpg', alt_text: 'Raindance Classic Ring Alternative View', is_primary: false, sort_order: 2 },

      // Eternity Band Images
      { product_id: products[2].id, image_url: '/images/Wedding.jpg', alt_text: 'Eternity Wedding Band', is_primary: true, sort_order: 1 },
      { product_id: products[2].id, image_url: '/images/Diamonds.jpg', alt_text: 'Eternity Band Detail', is_primary: false, sort_order: 2 },

      // Tennis Necklace Images
      { product_id: products[3].id, image_url: '/images/Diamonds.jpg', alt_text: 'Diamond Tennis Necklace', is_primary: true, sort_order: 1 },
      { product_id: products[3].id, image_url: '/images/Jewellery.jpg', alt_text: 'Tennis Necklace Styled', is_primary: false, sort_order: 2 },

      // Pearl Earrings Images
      { product_id: products[4].id, image_url: '/images/Jewellery.jpg', alt_text: 'Pearl Drop Earrings', is_primary: true, sort_order: 1 },
      { product_id: products[4].id, image_url: '/images/Engagement.png', alt_text: 'Pearl Earrings Detail', is_primary: false, sort_order: 2 },

      // Luxury Timepiece Images
      { product_id: products[5].id, image_url: '/images/Wedding.jpg', alt_text: 'Luxury Timepiece', is_primary: true, sort_order: 1 }
    ];

    await ProductImage.bulkCreate(imageData);
    console.log('✅ Product images created');

    // Create Product Variants
    const variantData = [
      // Variants for Ashoka Ring
      { product_id: products[0].id, variant_name: 'Platinum - Size L', metal_type: 'Platinum', metal_color: '#E5E4E2', size: 'L', stock_quantity: 1 },
      { product_id: products[0].id, variant_name: 'Platinum - Size M', metal_type: 'Platinum', metal_color: '#E5E4E2', size: 'M', stock_quantity: 1 },
      { product_id: products[0].id, variant_name: 'Gold - Size L', metal_type: 'Yellow Gold', metal_color: '#FFD700', size: 'L', price_adjustment: -2500, stock_quantity: 1 },

      // Variants for other products
      { product_id: products[1].id, variant_name: 'Platinum - Size M', metal_type: 'Platinum', metal_color: '#E5E4E2', size: 'M', stock_quantity: 2 },
      { product_id: products[1].id, variant_name: 'White Gold - Size M', metal_type: 'White Gold', metal_color: '#F8F8FF', size: 'M', price_adjustment: -2200, stock_quantity: 3 }
    ];

    await ProductVariant.bulkCreate(variantData);
    console.log('✅ Product variants created');

    console.log('🎉 Database seed completed successfully!');
    console.log(`
📊 Data Summary:
- Categories: ${categories.length}
- Collections: ${collections.length}
- Products: ${products.length}
- Product Images: ${imageData.length}
- Product Variants: ${variantData.length}
- Product Metals: 6
- Ring Sizes: 13

🚀 API Endpoints Available:
- GET /api/v1/products - Get all products
- GET /api/v1/products/categories - Get all categories
- GET /api/v1/products/category/rings - Get rings category products
- GET /api/v1/products/ashoka-five-stone-platinum-diamond-eternity-ring - Get product details

🌐 Test the API:
curl http://localhost:5000/api/v1/products/category/rings
`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
  }
};

// Run seed if file is executed directly
if (require.main === module) {
  seedData().then(() => process.exit(0));
}

module.exports = { seedData };
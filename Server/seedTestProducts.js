require('dotenv').config({ path: '.env.production' });

const { connectDatabases } = require('./config/database');
const { initializeModels, getModels } = require('./models');

const seedTestProducts = async () => {
  try {
    console.log('🔌 Connecting to databases...');
    await connectDatabases();

    console.log('🗂️ Initializing models...');
    initializeModels();

    const { Category, Collection, Product, ProductImage, ProductVariant } = getModels();

    console.log('🗂️ Creating sample categories...');

    // Create categories
    const categories = await Category.bulkCreate([
      {
        name: 'Rings',
        slug: 'rings',
        description: 'Beautiful engagement rings, wedding bands and fashion rings',
        is_active: true,
        sort_order: 1
      },
      {
        name: 'Necklaces',
        slug: 'necklaces',
        description: 'Elegant necklaces and pendants',
        is_active: true,
        sort_order: 2
      },
      {
        name: 'Earrings',
        slug: 'earrings',
        description: 'Stunning earrings for every occasion',
        is_active: true,
        sort_order: 3
      },
      {
        name: 'Bracelets',
        slug: 'bracelets',
        description: 'Stylish bracelets and bangles',
        is_active: true,
        sort_order: 4
      }
    ], { ignoreDuplicates: true });

    console.log('📦 Creating sample collections...');

    // Create collections
    const collections = await Collection.bulkCreate([
      {
        name: 'Heritage Collection',
        slug: 'heritage',
        description: 'Timeless pieces inspired by classic designs',
        is_active: true,
        sort_order: 1
      },
      {
        name: 'Modern Elegance',
        slug: 'modern-elegance',
        description: 'Contemporary designs for the modern woman',
        is_active: true,
        sort_order: 2
      },
      {
        name: 'Vintage Collection',
        slug: 'vintage',
        description: 'Inspired by vintage jewelry designs',
        is_active: true,
        sort_order: 3
      }
    ], { ignoreDuplicates: true });

    // Get category IDs
    const ringsCategory = await Category.findOne({ where: { slug: 'rings' } });
    const necklacesCategory = await Category.findOne({ where: { slug: 'necklaces' } });
    const earringsCategory = await Category.findOne({ where: { slug: 'earrings' } });

    // Get collection IDs
    const heritageCollection = await Collection.findOne({ where: { slug: 'heritage' } });
    const modernCollection = await Collection.findOne({ where: { slug: 'modern-elegance' } });

    console.log('💎 Creating sample products...');

    // Create sample products
    const products = [
      {
        name: 'Diamond Solitaire Engagement Ring',
        slug: 'diamond-solitaire-engagement-ring',
        description: 'A timeless diamond solitaire engagement ring featuring a brilliant-cut diamond set in 18ct white gold.',
        short_description: 'Classic diamond solitaire in 18ct white gold',
        sku: 'RIN-DIAMO-001',
        base_price: 2499.00,
        sale_price: 2199.00,
        currency: 'GBP',
        category_id: ringsCategory.id,
        collection_id: heritageCollection.id,
        is_active: true,
        is_featured: true,
        in_stock: true,
        stock_quantity: 5,
        weight: 3.2,
        dimensions: 'Size N (adjustable)',
        care_instructions: 'Clean with soft brush and mild soap. Store separately to avoid scratches.',
        warranty_info: 'Lifetime warranty against manufacturing defects',
        meta_title: 'Diamond Solitaire Engagement Ring | McCulloch Jewellers',
        meta_description: 'Beautiful diamond solitaire engagement ring in 18ct white gold. Perfect for proposals.'
      },
      {
        name: 'Vintage Pearl Necklace',
        slug: 'vintage-pearl-necklace',
        description: 'An elegant pearl necklace featuring cultured freshwater pearls with a vintage-inspired clasp.',
        short_description: 'Elegant cultured pearl necklace with vintage clasp',
        sku: 'NEC-PEARL-001',
        base_price: 450.00,
        currency: 'GBP',
        category_id: necklacesCategory.id,
        collection_id: modernCollection.id,
        is_active: true,
        is_featured: false,
        in_stock: true,
        stock_quantity: 12,
        weight: 15.8,
        dimensions: '18 inches',
        care_instructions: 'Wipe with soft cloth after wearing. Avoid contact with perfumes.',
        warranty_info: '2 year warranty on clasp mechanism',
        meta_title: 'Vintage Pearl Necklace | McCulloch Jewellers',
        meta_description: 'Elegant cultured pearl necklace with vintage-inspired clasp.'
      },
      {
        name: 'Gold Hoop Earrings',
        slug: 'gold-hoop-earrings',
        description: 'Classic 9ct gold hoop earrings, perfect for everyday wear or special occasions.',
        short_description: 'Classic 9ct gold hoop earrings',
        sku: 'EAR-HOOP-001',
        base_price: 189.00,
        currency: 'GBP',
        category_id: earringsCategory.id,
        is_active: true,
        is_featured: true,
        in_stock: true,
        stock_quantity: 8,
        weight: 2.1,
        dimensions: '20mm diameter',
        care_instructions: 'Polish with jewelry cloth to maintain shine.',
        warranty_info: '1 year warranty against manufacturing defects',
        meta_title: 'Gold Hoop Earrings | McCulloch Jewellers',
        meta_description: 'Classic 9ct gold hoop earrings perfect for any occasion.'
      },
      {
        name: 'Sapphire Tennis Bracelet',
        slug: 'sapphire-tennis-bracelet',
        description: 'Stunning tennis bracelet featuring blue sapphires set in sterling silver.',
        short_description: 'Blue sapphire tennis bracelet in sterling silver',
        sku: 'BRA-SAPPH-001',
        base_price: 899.00,
        currency: 'GBP',
        category_id: (await Category.findOne({ where: { slug: 'bracelets' } })).id,
        collection_id: heritageCollection.id,
        is_active: true,
        is_featured: false,
        in_stock: false,
        stock_quantity: 0,
        weight: 8.5,
        dimensions: '7 inches',
        care_instructions: 'Clean gently with soft brush. Avoid harsh chemicals.',
        warranty_info: 'Lifetime warranty on setting',
        meta_title: 'Sapphire Tennis Bracelet | McCulloch Jewellers',
        meta_description: 'Elegant blue sapphire tennis bracelet in sterling silver.'
      },
      {
        name: 'Rose Gold Wedding Band',
        slug: 'rose-gold-wedding-band',
        description: 'Beautiful 18ct rose gold wedding band with a polished finish.',
        short_description: '18ct rose gold wedding band',
        sku: 'RIN-WEDDI-002',
        base_price: 650.00,
        currency: 'GBP',
        category_id: ringsCategory.id,
        is_active: false,
        is_featured: false,
        in_stock: true,
        stock_quantity: 3,
        weight: 4.2,
        dimensions: 'Size M (adjustable)',
        care_instructions: 'Polish regularly to maintain rose gold finish.',
        warranty_info: 'Lifetime warranty against manufacturing defects',
        meta_title: 'Rose Gold Wedding Band | McCulloch Jewellers',
        meta_description: '18ct rose gold wedding band with polished finish.'
      }
    ];

    const createdProducts = await Product.bulkCreate(products);

    console.log('🖼️ Creating sample product images...');

    // Add sample images for products
    const sampleImages = [
      {
        product_id: createdProducts[0].id,
        image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500',
        alt_text: 'Diamond Solitaire Ring - Main View',
        is_primary: true,
        sort_order: 0
      },
      {
        product_id: createdProducts[1].id,
        image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500',
        alt_text: 'Pearl Necklace - Main View',
        is_primary: true,
        sort_order: 0
      },
      {
        product_id: createdProducts[2].id,
        image_url: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500',
        alt_text: 'Gold Hoop Earrings - Main View',
        is_primary: true,
        sort_order: 0
      }
    ];

    await ProductImage.bulkCreate(sampleImages);

    console.log('🔧 Creating sample product variants...');

    // Add variants for the diamond ring
    const ringVariants = [
      {
        product_id: createdProducts[0].id,
        variant_name: 'Size L',
        sku: 'RIN-DIAMO-001-L',
        price_adjustment: 0,
        size: 'L',
        stock_quantity: 2,
        is_active: true
      },
      {
        product_id: createdProducts[0].id,
        variant_name: 'Size M',
        sku: 'RIN-DIAMO-001-M',
        price_adjustment: 0,
        size: 'M',
        stock_quantity: 2,
        is_active: true
      },
      {
        product_id: createdProducts[0].id,
        variant_name: 'Size N',
        sku: 'RIN-DIAMO-001-N',
        price_adjustment: 0,
        size: 'N',
        stock_quantity: 1,
        is_active: true
      }
    ];

    await ProductVariant.bulkCreate(ringVariants);

    console.log('✅ Test products seeded successfully!');
    console.log(`Created ${categories.length} categories, ${collections.length} collections, and ${createdProducts.length} products`);

  } catch (error) {
    console.error('❌ Error seeding test products:', error);
  } finally {
    console.log('🏁 Seeding completed');
    process.exit(0);
  }
};

// Run the seeder if called directly
if (require.main === module) {
  seedTestProducts();
}

module.exports = { seedTestProducts };
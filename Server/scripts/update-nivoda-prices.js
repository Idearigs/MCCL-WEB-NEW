/**
 * Nivoda Price Update Cron Job
 *
 * This script updates prices for all Nivoda-enabled products by fetching
 * the latest diamond prices from the Nivoda API.
 *
 * It should be run as a scheduled task (e.g., daily at 2:00 AM)
 *
 * Usage:
 *   node scripts/update-nivoda-prices.js
 *
 * Or with PM2:
 *   pm2 start scripts/update-nivoda-prices.js --cron "0 2 * * *" --name nivoda-price-updater
 */

require('dotenv').config();
const { connectDatabases, postgresDB, closeDatabases } = require('../config/database');
const nivodaService = require('../services/nivodaService');

async function updateNivodaPrices() {
  console.log('\n========================================');
  console.log('Nivoda Price Update Job Started');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('========================================\n');

  try {
    // Check if Nivoda is configured
    if (!nivodaService.isConfigured()) {
      console.log('⚠️  Nivoda API credentials not configured. Skipping price update.');
      console.log('   Set NIVODA_API_KEY and NIVODA_API_SECRET in .env to enable.\n');
      process.exit(0);
    }

    // Connect to database
    console.log('Connecting to database...');
    await connectDatabases();
    const sequelize = postgresDB();

    if (!sequelize) {
      throw new Error('Database connection failed');
    }

    console.log('✅ Database connected\n');

    // Get all Nivoda-enabled products
    const [products] = await sequelize.query(`
      SELECT
        id,
        name,
        sku,
        base_price,
        nivoda_enabled,
        show_stone_type,
        show_carat,
        show_clarity,
        show_colour,
        show_cut
      FROM products
      WHERE nivoda_enabled = true AND is_active = true
    `);

    if (!products || products.length === 0) {
      console.log('ℹ️  No Nivoda-enabled products found. Nothing to update.\n');
      await closeDatabases();
      process.exit(0);
    }

    console.log(`Found ${products.length} Nivoda-enabled products\n`);

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Process products in batches of 10 to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} products)...`);

      for (const product of batch) {
        try {
          console.log(`  Updating: ${product.name} (${product.sku || 'No SKU'})`);

          // For demo purposes, we'll search for default diamond specs
          // In production, you'd want to store preferred diamond specs with each product
          const diamonds = await nivodaService.searchDiamonds({
            stoneType: 'natural',
            caratFrom: 0.5,
            caratTo: 1.0,
            clarity: ['VS1', 'VS2'],
            color: ['F', 'G'],
            cut: ['EX', 'VG'],
            shapes: ['round']
          });

          if (!diamonds || diamonds.length === 0) {
            console.log(`    ⚠️  No matching diamonds found`);
            failCount++;
            continue;
          }

          // Get average price of top 3 diamonds (for more stable pricing)
          const topDiamonds = diamonds.slice(0, 3);
          const avgDiamondPrice = topDiamonds.reduce((sum, d) => sum + parseFloat(d.total_sales_price), 0) / topDiamonds.length;

          // Calculate new product price (diamond price + base markup)
          const baseMarkup = parseFloat(product.base_price) || 500; // Default markup if not set
          const newPrice = avgDiamondPrice + baseMarkup;

          // Update product price in database
          await sequelize.query(`
            UPDATE products
            SET
              base_price = :newPrice,
              updated_at = NOW()
            WHERE id = :productId
          `, {
            replacements: {
              newPrice: newPrice.toFixed(2),
              productId: product.id
            }
          });

          console.log(`    ✅ Updated: £${parseFloat(product.base_price).toFixed(2)} → £${newPrice.toFixed(2)}`);
          successCount++;

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.log(`    ❌ Failed: ${error.message}`);
          failCount++;
          errors.push({
            product: product.name,
            error: error.message
          });
        }
      }

      // Longer delay between batches
      if (i + batchSize < products.length) {
        console.log('  Waiting 2 seconds before next batch...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n========================================');
    console.log('Price Update Summary');
    console.log('========================================');
    console.log(`✅ Successfully updated: ${successCount} products`);
    console.log(`❌ Failed to update: ${failCount} products`);
    console.log(`📊 Total processed: ${products.length} products`);

    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.product}: ${err.error}`);
      });
    }

    console.log(`\nCompleted at: ${new Date().toISOString()}`);
    console.log('========================================\n');

    await closeDatabases();
    process.exit(0);

  } catch (error) {
    console.error('\n========================================');
    console.error('❌ Price update job failed:');
    console.error('========================================');
    console.error(error);
    console.error('\n');
    await closeDatabases().catch(console.error);
    process.exit(1);
  }
}

// Run the update
updateNivodaPrices();

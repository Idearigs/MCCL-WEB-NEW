/**
 * Fix invalid Nivoda options that were saved to the database
 * This script sanitizes any invalid cut/clarity/colour options from all products
 */

require('dotenv').config();
const { connectDatabases, postgresDB } = require('./config/database');
const { initializeModels } = require('./models');

// Valid Nivoda grades
const VALID_CUTS = ['EX', 'VG', 'G', 'F'];
const VALID_CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'SI3', 'I1', 'I2', 'I3'];
const VALID_COLOURS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];

async function fixInvalidOptions() {
  try {
    console.log('\n🔍 Scanning for invalid Nivoda options in database...\n');

    await connectDatabases();
    initializeModels();
    const sequelize = postgresDB();
    const { Product } = require('./models').getModels();

    // Find all products with nivoda_options_config
    const { Op } = require('sequelize');
    const productsWithConfig = await Product.findAll({
      where: {
        nivoda_options_config: {
          [Op.not]: null
        }
      }
    });

    console.log(`📊 Found ${productsWithConfig.length} products with Nivoda configuration\n`);

    let productsFixed = 0;
    let invalidCutsRemoved = [];
    let invalidClaritiesRemoved = [];
    let invalidColoursRemoved = [];

    for (const product of productsWithConfig) {
      const config = product.nivoda_options_config;
      let hasInvalid = false;

      // Check and sanitize cuts
      if (config.cutOptions && Array.isArray(config.cutOptions)) {
        const invalidCuts = config.cutOptions.filter(c => !VALID_CUTS.includes(c.toUpperCase()));
        if (invalidCuts.length > 0) {
          console.log(`   Product: "${product.name}"`);
          console.log(`   ❌ Invalid cuts found: ${invalidCuts.join(', ')}`);
          config.cutOptions = config.cutOptions.filter(c => VALID_CUTS.includes(c.toUpperCase()));
          config.cutOptions = config.cutOptions.map(c => c.toUpperCase());
          invalidCutsRemoved.push(...invalidCuts);
          hasInvalid = true;
        }
      }

      // Check and sanitize clarities
      if (config.clarityOptions && Array.isArray(config.clarityOptions)) {
        const invalidClarities = config.clarityOptions.filter(c => !VALID_CLARITIES.includes(c.toUpperCase()));
        if (invalidClarities.length > 0) {
          console.log(`   Product: "${product.name}"`);
          console.log(`   ❌ Invalid clarities found: ${invalidClarities.join(', ')}`);
          config.clarityOptions = config.clarityOptions.filter(c => VALID_CLARITIES.includes(c.toUpperCase()));
          config.clarityOptions = config.clarityOptions.map(c => c.toUpperCase());
          invalidClaritiesRemoved.push(...invalidClarities);
          hasInvalid = true;
        }
      }

      // Check and sanitize colours
      if (config.colourOptions && Array.isArray(config.colourOptions)) {
        const invalidColours = config.colourOptions.filter(c => !VALID_COLOURS.includes(c.toUpperCase()));
        if (invalidColours.length > 0) {
          console.log(`   Product: "${product.name}"`);
          console.log(`   ❌ Invalid colours found: ${invalidColours.join(', ')}`);
          config.colourOptions = config.colourOptions.filter(c => VALID_COLOURS.includes(c.toUpperCase()));
          config.colourOptions = config.colourOptions.map(c => c.toUpperCase());
          invalidColoursRemoved.push(...invalidColours);
          hasInvalid = true;
        }
      }

      // Save if changes made
      if (hasInvalid) {
        await product.update({ nivoda_options_config: config });
        console.log(`   ✅ Fixed!\n`);
        productsFixed++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Products fixed: ${productsFixed}`);
    console.log(`   ❌ Invalid cuts removed: ${[...new Set(invalidCutsRemoved)].join(', ') || 'None'}`);
    console.log(`   ❌ Invalid clarities removed: ${[...new Set(invalidClaritiesRemoved)].join(', ') || 'None'}`);
    console.log(`   ❌ Invalid colours removed: ${[...new Set(invalidColoursRemoved)].join(', ') || 'None'}`);

    console.log(`\n✅ All invalid Nivoda options have been sanitized!\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing invalid options:', error);
    process.exit(1);
  }
}

fixInvalidOptions();

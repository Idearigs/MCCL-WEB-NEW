const { connectDatabases, logger } = require('../config/database');
const { initializeModels, getModels } = require('../models');

// Helper function to generate slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Data structure based on the image provided
const categoryStructure = {
  mainCategories: [
    'Rings',
    'Earrings',
    'Necklaces',
    'Bracelets'
  ],
  subcategories: {
    'Rings': {
      'Ring Types': [
        'Wedding',
        'Engagement',
        'Vintage',
        'Promise',
        'Wishbone',
        'Stacking',
        'Cocktail',
        'Bridal sets',
        'Men\'s Rings',
        'All Rings'
      ],
      'Gemstones': [
        'Mined Diamond',
        'Lab Grown Diamond',
        'Sapphire',
        'Emerald',
        'Ruby',
        'Aquamarine',
        'Tanzanite',
        'Blue Topaz'
      ],
      'Eternity Rings': [
        'Diamond Full Band',
        'Diamond Half Band',
        'Unique Eternity Rings',
        'Sapphire',
        'Emerald',
        'Ruby',
        'Men\'s Eternity Rings',
        'All Eternity Rings'
      ],
      'Metals': [
        'Yellow Gold',
        'White Gold',
        'Platinum',
        'Silver',
        'Gold Vermeil'
      ]
    },
    'Earrings': {
      'Earring Types': [
        'Stud Earrings',
        'Drop Earrings',
        'Hoop Earrings',
        'Huggie Earrings',
        'Chandelier Earrings',
        'Threader Earrings',
        'Clip-on Earrings'
      ],
      'Gemstones': [
        'Mined Diamond',
        'Lab Grown Diamond',
        'Sapphire',
        'Emerald',
        'Ruby',
        'Aquamarine',
        'Tanzanite',
        'Blue Topaz'
      ],
      'Metals': [
        'Yellow Gold',
        'White Gold',
        'Platinum',
        'Silver',
        'Gold Vermeil'
      ]
    },
    'Necklaces': {
      'Necklace Types': [
        'Chain Necklaces',
        'Pendant Necklaces',
        'Choker Necklaces',
        'Statement Necklaces',
        'Tennis Necklaces',
        'Locket Necklaces',
        'Collar Necklaces'
      ],
      'Gemstones': [
        'Mined Diamond',
        'Lab Grown Diamond',
        'Sapphire',
        'Emerald',
        'Ruby',
        'Aquamarine',
        'Tanzanite',
        'Blue Topaz'
      ],
      'Metals': [
        'Yellow Gold',
        'White Gold',
        'Platinum',
        'Silver',
        'Gold Vermeil'
      ]
    },
    'Bracelets': {
      'Bracelet Types': [
        'Chain Bracelets',
        'Bangle Bracelets',
        'Charm Bracelets',
        'Tennis Bracelets',
        'Cuff Bracelets',
        'Link Bracelets',
        'Beaded Bracelets'
      ],
      'Gemstones': [
        'Mined Diamond',
        'Lab Grown Diamond',
        'Sapphire',
        'Emerald',
        'Ruby',
        'Aquamarine',
        'Tanzanite',
        'Blue Topaz'
      ],
      'Metals': [
        'Yellow Gold',
        'White Gold',
        'Platinum',
        'Silver',
        'Gold Vermeil'
      ]
    }
  }
};

const seedHierarchicalCategories = async () => {
  try {
    console.log('Starting hierarchical category seeding...');

    // Connect to database
    await connectDatabases();

    // Initialize models
    initializeModels();
    const { Category } = getModels();

    if (!Category) {
      throw new Error('Category model not initialized');
    }

    // Sync database schema with new structure
    logger.info('Syncing database schema...');
    await Category.sync({ alter: true });

    // Clear existing categories
    logger.info('Clearing existing categories...');
    await Category.destroy({ where: {}, truncate: true, cascade: true });

    // Create main categories first
    logger.info('Creating main categories...');
    const mainCategoryIds = {};

    for (let i = 0; i < categoryStructure.mainCategories.length; i++) {
      const mainCategoryName = categoryStructure.mainCategories[i];
      const mainCategory = await Category.create({
        name: mainCategoryName,
        slug: generateSlug(mainCategoryName),
        description: `${mainCategoryName} collection`,
        parent_id: null,
        category_type: 'main',
        level: 0,
        sort_order: i,
        is_active: true
      });

      mainCategoryIds[mainCategoryName] = mainCategory.id;
      logger.info(`Created main category: ${mainCategoryName} (${mainCategory.id})`);
    }

    // Create subcategories
    logger.info('Creating subcategories...');

    for (const [mainCategoryName, subcategoryGroups] of Object.entries(categoryStructure.subcategories)) {
      const mainCategoryId = mainCategoryIds[mainCategoryName];

      for (const [subcategoryGroupName, subcategoryItems] of Object.entries(subcategoryGroups)) {
        // Map category group names to types
        let categoryType = 'sub_type';
        if (subcategoryGroupName.includes('Gemstone')) categoryType = 'sub_gemstone';
        else if (subcategoryGroupName.includes('Metal')) categoryType = 'sub_metal';
        else if (subcategoryGroupName.includes('Eternity')) categoryType = 'sub_eternity';

        // Create subcategory group (level 1)
        const uniqueGroupName = `${mainCategoryName} ${subcategoryGroupName}`;
        const subcategoryGroup = await Category.create({
          name: uniqueGroupName,
          slug: generateSlug(`${mainCategoryName}-${subcategoryGroupName}`),
          description: `${subcategoryGroupName} for ${mainCategoryName}`,
          parent_id: mainCategoryId,
          category_type: categoryType,
          level: 1,
          sort_order: Object.keys(subcategoryGroups).indexOf(subcategoryGroupName),
          is_active: true
        });

        logger.info(`Created subcategory group: ${subcategoryGroupName} under ${mainCategoryName}`);

        // Create individual subcategory items (level 2)
        for (let j = 0; j < subcategoryItems.length; j++) {
          const subcategoryItemName = subcategoryItems[j];
          const uniqueName = `${mainCategoryName} ${subcategoryGroupName} ${subcategoryItemName}`;
          await Category.create({
            name: uniqueName,
            slug: generateSlug(`${mainCategoryName}-${subcategoryGroupName}-${subcategoryItemName}`),
            description: `${subcategoryItemName} in ${subcategoryGroupName} for ${mainCategoryName}`,
            parent_id: subcategoryGroup.id,
            category_type: categoryType,
            level: 2,
            sort_order: j,
            is_active: true
          });

          logger.info(`Created subcategory item: ${uniqueName}`);
        }
      }
    }

    // Display final structure
    logger.info('Final category structure:');
    const allCategories = await Category.findAll({
      order: [['level', 'ASC'], ['sort_order', 'ASC']],
      include: [
        { model: Category, as: 'parent', attributes: ['name'] },
        { model: Category, as: 'children', attributes: ['name', 'id'] }
      ]
    });

    allCategories.forEach(cat => {
      const indent = '  '.repeat(cat.level);
      const parentName = cat.parent ? ` (under ${cat.parent.name})` : '';
      logger.info(`${indent}${cat.name} [${cat.category_type}]${parentName}`);
    });

    logger.info('Hierarchical category seeding completed successfully!');
    logger.info(`Total categories created: ${allCategories.length}`);

    // Count by level
    const levelCounts = allCategories.reduce((acc, cat) => {
      acc[cat.level] = (acc[cat.level] || 0) + 1;
      return acc;
    }, {});

    logger.info('Categories by level:', levelCounts);

  } catch (error) {
    logger.error('Error seeding hierarchical categories:', error);
    throw error;
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedHierarchicalCategories()
    .then(() => {
      logger.info('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedHierarchicalCategories };
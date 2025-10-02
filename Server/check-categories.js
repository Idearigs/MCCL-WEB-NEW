const { connectDatabases } = require('./config/database');
const { initializeModels, getModels } = require('./models');

const checkCategories = async () => {
  try {
    // Connect to database
    await connectDatabases();

    // Initialize models
    initializeModels();
    const { Category } = getModels();

    // Get all categories ordered by level and name
    const categories = await Category.findAll({
      order: [['level', 'ASC'], ['sort_order', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'name', 'slug', 'parent_id', 'category_type', 'level', 'sort_order']
    });

    console.log('\n=== CATEGORY ANALYSIS ===');
    console.log(`Total categories: ${categories.length}\n`);

    // Group by level
    const byLevel = categories.reduce((acc, cat) => {
      acc[cat.level] = acc[cat.level] || [];
      acc[cat.level].push(cat);
      return acc;
    }, {});

    // Show statistics
    Object.keys(byLevel).forEach(level => {
      console.log(`Level ${level}: ${byLevel[level].length} categories`);
    });

    console.log('\n=== MAIN CATEGORIES (Level 0) ===');
    const mainCategories = byLevel[0] || [];
    mainCategories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.category_type})`);
    });

    console.log('\n=== SUBCATEGORY GROUPS (Level 1) ===');
    const subGroups = byLevel[1] || [];
    subGroups.forEach(cat => {
      console.log(`- ${cat.name} (${cat.category_type})`);
    });

    console.log('\n=== ITEMS (Level 2) ===');
    const items = byLevel[2] || [];
    console.log(`Total items: ${items.length}`);

    // Check for duplicates
    const names = categories.map(c => c.name);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

    if (duplicates.length > 0) {
      console.log('\n=== DUPLICATE NAMES FOUND ===');
      const uniqueDuplicates = [...new Set(duplicates)];
      uniqueDuplicates.forEach(name => {
        const count = names.filter(n => n === name).length;
        console.log(`- "${name}" appears ${count} times`);

        // Show all records with this name
        const records = categories.filter(c => c.name === name);
        records.forEach(r => {
          console.log(`  * ID: ${r.id}, Level: ${r.level}, Type: ${r.category_type}, Parent: ${r.parent_id}`);
        });
      });
    } else {
      console.log('\n✅ No duplicate names found');
    }

    // Show sample structure
    console.log('\n=== SAMPLE HIERARCHICAL STRUCTURE ===');
    const firstMain = mainCategories[0];
    if (firstMain) {
      console.log(`${firstMain.name}`);

      const childGroups = subGroups.filter(sg => sg.parent_id === firstMain.id);
      childGroups.slice(0, 2).forEach(group => {
        console.log(`├── ${group.name}`);

        const groupItems = items.filter(item => item.parent_id === group.id);
        groupItems.slice(0, 3).forEach((item, index) => {
          const isLast = index === groupItems.slice(0, 3).length - 1;
          console.log(`│   ${isLast ? '└──' : '├──'} ${item.name}`);
        });
        if (groupItems.length > 3) {
          console.log(`│   └── ... (${groupItems.length - 3} more items)`);
        }
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking categories:', error);
    process.exit(1);
  }
};

checkCategories();
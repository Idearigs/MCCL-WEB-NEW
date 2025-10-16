/**
 * Migration: Restructure Jewelry Categories
 *
 * This migration:
 * 1. Renames gemstones table to stone_shapes
 * 2. Creates stone_types table
 * 3. Updates ring_types data with new ring styles
 * 4. Adds 5 ring_style fields to products table
 * 5. Adds stone_type_id to products table
 * 6. Updates all related data
 */

const { postgresDB } = require('../config/database');

const stoneShapes = [
  { name: 'Round', slug: 'round', sort_order: 1 },
  { name: 'Princess', slug: 'princess', sort_order: 2 },
  { name: 'Oval', slug: 'oval', sort_order: 3 },
  { name: 'Pear', slug: 'pear', sort_order: 4 },
  { name: 'Marquise', slug: 'marquise', sort_order: 5 },
  { name: 'Emerald', slug: 'emerald', sort_order: 6 },
  { name: 'Radiant', slug: 'radiant', sort_order: 7 },
  { name: 'Cushion', slug: 'cushion', sort_order: 8 },
  { name: 'Heart', slug: 'heart', sort_order: 9 },
  { name: 'Asscher', slug: 'asscher', sort_order: 10 },
  { name: 'Trillion', slug: 'trillion', sort_order: 11 },
  { name: 'Baguette', slug: 'baguette', sort_order: 12 }
];

const stoneTypes = [
  { name: 'Natural Diamond', slug: 'natural-diamond', sort_order: 1 },
  { name: 'Lab Grown Diamond', slug: 'lab-grown-diamond', sort_order: 2 },
  { name: 'Yellow Diamond', slug: 'yellow-diamond', sort_order: 3 },
  { name: 'Black Diamond', slug: 'black-diamond', sort_order: 4 },
  { name: 'Sapphire', slug: 'sapphire', sort_order: 5 },
  { name: 'Ruby', slug: 'ruby', sort_order: 6 },
  { name: 'Emerald', slug: 'emerald-stone', sort_order: 7 },
  { name: 'Aquamarine', slug: 'aquamarine', sort_order: 8 },
  { name: 'Tanzanite', slug: 'tanzanite', sort_order: 9 },
  { name: 'Amethyst', slug: 'amethyst', sort_order: 10 },
  { name: 'Topaz', slug: 'topaz', sort_order: 11 },
  { name: 'Morganite', slug: 'morganite', sort_order: 12 },
  { name: 'Peridot', slug: 'peridot', sort_order: 13 },
  { name: 'Tourmaline', slug: 'tourmaline', sort_order: 14 },
  { name: 'Zircon', slug: 'zircon', sort_order: 15 },
  { name: 'Spinel', slug: 'spinel', sort_order: 16 }
];

const ringStyles = [
  { name: 'Solitaire', slug: 'solitaire', sort_order: 1 },
  { name: 'Shoulder Set', slug: 'shoulder-set', sort_order: 2 },
  { name: 'Halo', slug: 'halo', sort_order: 3 },
  { name: 'Hidden Halo', slug: 'hidden-halo', sort_order: 4 },
  { name: 'Trilogy', slug: 'trilogy', sort_order: 5 },
  { name: 'Bezel', slug: 'bezel', sort_order: 6 },
  { name: '2 Stones', slug: '2-stones', sort_order: 7 },
  { name: 'Vintage', slug: 'vintage', sort_order: 8 },
  { name: 'Bridal Set', slug: 'bridal-set', sort_order: 9 },
  { name: 'Mens', slug: 'mens', sort_order: 10 },
  { name: 'Modern/Contemporary', slug: 'modern-contemporary', sort_order: 11 },
  { name: '5 Stones', slug: '5-stones', sort_order: 12 },
  { name: 'Cross Over', slug: 'cross-over', sort_order: 13 },
  { name: 'Wed-fit', slug: 'wed-fit', sort_order: 14 },
  { name: 'Shaped Wedding Band', slug: 'shaped-wedding-band', sort_order: 15 }
];

async function up() {
  const sequelize = postgresDB();
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log('Starting jewelry categories restructure migration...');

    // Step 1: Rename gemstones table to stone_shapes
    console.log('Step 1: Renaming gemstones table to stone_shapes...');
    await queryInterface.renameTable('gemstones', 'stone_shapes');

    // Step 2: Rename related columns
    console.log('Step 2: Renaming gemstone_id to stone_shape_id in products...');
    await queryInterface.renameColumn('products', 'gemstone_id', 'stone_shape_id');

    // Step 3: Rename junction table
    console.log('Step 3: Renaming product_gemstones to product_stone_shapes...');
    await queryInterface.renameTable('product_gemstones', 'product_stone_shapes');
    await queryInterface.renameColumn('product_stone_shapes', 'gemstone_id', 'stone_shape_id');

    // Step 4: Clear existing data from stone_shapes and insert new data
    console.log('Step 4: Clearing and updating stone_shapes data...');
    await sequelize.query('DELETE FROM product_stone_shapes');
    await sequelize.query('DELETE FROM stone_shapes');

    for (const shape of stoneShapes) {
      await sequelize.query(`
        INSERT INTO stone_shapes (id, name, slug, is_active, sort_order, created_at, updated_at)
        VALUES (gen_random_uuid(), :name, :slug, true, :sort_order, NOW(), NOW())
      `, {
        replacements: shape
      });
    }

    // Step 5: Create stone_types table
    console.log('Step 5: Creating stone_types table...');
    await queryInterface.createTable('stone_types', {
      id: {
        type: 'UUID',
        defaultValue: sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },
      name: {
        type: 'VARCHAR(100)',
        allowNull: false,
        unique: true
      },
      slug: {
        type: 'VARCHAR(100)',
        allowNull: false,
        unique: true
      },
      description: {
        type: 'TEXT'
      },
      is_active: {
        type: 'BOOLEAN',
        defaultValue: true
      },
      sort_order: {
        type: 'INTEGER',
        defaultValue: 0
      },
      created_at: {
        type: 'TIMESTAMP',
        allowNull: false
      },
      updated_at: {
        type: 'TIMESTAMP',
        allowNull: false
      }
    });

    // Step 6: Insert stone types data
    console.log('Step 6: Inserting stone types data...');
    for (const type of stoneTypes) {
      await sequelize.query(`
        INSERT INTO stone_types (id, name, slug, is_active, sort_order, created_at, updated_at)
        VALUES (gen_random_uuid(), :name, :slug, true, :sort_order, NOW(), NOW())
      `, {
        replacements: type
      });
    }

    // Step 7: Add stone_type_id to products table
    console.log('Step 7: Adding stone_type_id to products table...');
    await queryInterface.addColumn('products', 'stone_type_id', {
      type: 'UUID',
      allowNull: true,
      references: {
        model: 'stone_types',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Step 8: Clear and update ring_types data
    console.log('Step 8: Updating ring_types data...');
    await sequelize.query('DELETE FROM product_ring_types');
    await sequelize.query('DELETE FROM ring_types');

    for (const style of ringStyles) {
      await sequelize.query(`
        INSERT INTO ring_types (id, name, slug, is_active, sort_order, created_at, updated_at)
        VALUES (gen_random_uuid(), :name, :slug, true, :sort_order, NOW(), NOW())
      `, {
        replacements: style
      });
    }

    // Step 9: Add 5 ring style columns to products (ring_style_1_id through ring_style_5_id)
    console.log('Step 9: Adding ring_style columns to products...');
    for (let i = 1; i <= 5; i++) {
      await queryInterface.addColumn('products', `ring_style_${i}_id`, {
        type: 'UUID',
        allowNull: true,
        references: {
          model: 'ring_types',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function down() {
  const sequelize = postgresDB();
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log('Rolling back jewelry categories restructure migration...');

    // Remove ring_style columns
    for (let i = 1; i <= 5; i++) {
      await queryInterface.removeColumn('products', `ring_style_${i}_id`);
    }

    // Remove stone_type_id
    await queryInterface.removeColumn('products', 'stone_type_id');

    // Drop stone_types table
    await queryInterface.dropTable('stone_types');

    // Rename back to gemstones
    await queryInterface.renameColumn('product_stone_shapes', 'stone_shape_id', 'gemstone_id');
    await queryInterface.renameTable('product_stone_shapes', 'product_gemstones');
    await queryInterface.renameColumn('products', 'stone_shape_id', 'gemstone_id');
    await queryInterface.renameTable('stone_shapes', 'gemstones');

    console.log('Rollback completed!');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

module.exports = { up, down };

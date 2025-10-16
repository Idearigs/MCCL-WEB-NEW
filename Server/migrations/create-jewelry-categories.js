/**
 * Migration: Create Jewelry Categories with New Structure
 *
 * This migration creates the jewelry category tables with the new structure:
 * - stone_shapes table
 * - stone_types table
 * - ring_types table (updated data)
 * - Adds new fields to products table
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
    console.log('Starting jewelry categories creation...');

    // Check if stone_shapes table exists
    const tableCheck = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stone_shapes')",
      { type: sequelize.QueryTypes.SELECT }
    );

    if (!tableCheck[0].exists) {
      // Create stone_shapes table
      console.log('Creating stone_shapes table...');
      await queryInterface.createTable('stone_shapes', {
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
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      // Insert stone shapes data
      console.log('Inserting stone shapes data...');
      for (const shape of stoneShapes) {
        await sequelize.query(`
          INSERT INTO stone_shapes (id, name, slug, is_active, sort_order, created_at, updated_at)
          VALUES (gen_random_uuid(), :name, :slug, true, :sort_order, NOW(), NOW())
        `, {
          replacements: shape
        });
      }
    } else {
      console.log('stone_shapes table already exists, skipping creation...');
    }

    // Check if stone_types table exists
    const stoneTypesCheck = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stone_types')",
      { type: sequelize.QueryTypes.SELECT }
    );

    if (!stoneTypesCheck[0].exists) {
      // Create stone_types table
      console.log('Creating stone_types table...');
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
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      // Insert stone types data
      console.log('Inserting stone types data...');
      for (const type of stoneTypes) {
        await sequelize.query(`
          INSERT INTO stone_types (id, name, slug, is_active, sort_order, created_at, updated_at)
          VALUES (gen_random_uuid(), :name, :slug, true, :sort_order, NOW(), NOW())
        `, {
          replacements: type
        });
      }
    } else {
      console.log('stone_types table already exists, skipping creation...');
    }

    // Check if product_stone_shapes junction table exists
    const junctionCheck = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_stone_shapes')",
      { type: sequelize.QueryTypes.SELECT }
    );

    if (!junctionCheck[0].exists) {
      console.log('Creating product_stone_shapes junction table...');
      await queryInterface.createTable('product_stone_shapes', {
        product_id: {
          type: 'UUID',
          allowNull: false,
          references: {
            model: 'products',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        stone_shape_id: {
          type: 'UUID',
          allowNull: false,
          references: {
            model: 'stone_shapes',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        created_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await sequelize.query(`
        ALTER TABLE product_stone_shapes
        ADD CONSTRAINT product_stone_shapes_pkey PRIMARY KEY (product_id, stone_shape_id)
      `);
    } else {
      console.log('product_stone_shapes junction table already exists...');
    }

    // Check if columns exist in products table before adding
    const columnsCheck = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'products'
      AND column_name IN ('stone_type_id', 'ring_style_1_id', 'ring_style_2_id', 'ring_style_3_id', 'ring_style_4_id', 'ring_style_5_id')
    `, { type: sequelize.QueryTypes.SELECT });

    const existingColumns = columnsCheck.map(row => row.column_name);

    // Add stone_type_id to products table if it doesn't exist
    if (!existingColumns.includes('stone_type_id')) {
      console.log('Adding stone_type_id to products table...');
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
    }

    // Add 5 ring style columns to products
    for (let i = 1; i <= 5; i++) {
      const columnName = `ring_style_${i}_id`;
      if (!existingColumns.includes(columnName)) {
        console.log(`Adding ${columnName} to products table...`);
        await queryInterface.addColumn('products', columnName, {
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
    }

    // Update ring_types data
    console.log('Updating ring_types data...');
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
    console.log('Rolling back jewelry categories creation...');

    // Remove ring_style columns
    for (let i = 1; i <= 5; i++) {
      await queryInterface.removeColumn('products', `ring_style_${i}_id`);
    }

    // Remove stone_type_id
    await queryInterface.removeColumn('products', 'stone_type_id');

    // Drop tables
    await queryInterface.dropTable('product_stone_shapes');
    await queryInterface.dropTable('stone_types');
    await queryInterface.dropTable('stone_shapes');

    console.log('Rollback completed!');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

module.exports = { up, down };

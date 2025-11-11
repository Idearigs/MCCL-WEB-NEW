/**
 * Migration: Add comprehensive watch specification fields
 * This migration adds support for storing detailed technical specifications
 * for all watch brands (Festina, Briston, Roamer)
 *
 * Date: 2025-11-10
 * Compatible with: PostgreSQL, Sequelize
 */

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const transaction = await queryInterface.sequelize.transaction();

      // Get existing columns
      const tableInfo = await queryInterface.describeTable('watch_specifications', { transaction });

      const newColumns = {
        // Case specifications
        case_shape: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Shape of the watch case (Round, Square, Rectangular, etc.)'
        },
        case_weight: {
          type: DataTypes.STRING(50),
          allowNull: true,
          comment: 'Weight of the watch case'
        },

        // Dial specifications
        strap_width: {
          type: DataTypes.STRING(50),
          allowNull: true,
          comment: 'Width of the watch strap'
        },
        dial_colour: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Colour of the dial (alternative to dial_color)'
        },
        dial_crystal: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Type of crystal on the dial'
        },
        dial_hands_count: {
          type: DataTypes.STRING(50),
          allowNull: true,
          comment: 'Number of hands on the dial'
        },

        // Movement specifications
        movement_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Specific name of the movement'
        },
        movement_battery_type: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Type of battery used in the movement'
        },
        movement_manufacturing: {
          type: DataTypes.STRING(255),
          allowNull: true,
          comment: 'Manufacturing details of the movement'
        },

        // Features
        additional_features: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Additional features beyond standard specifications'
        },
        watertightness: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Watertightness rating of the watch'
        }
      };

      // Add only columns that don't exist
      for (const [columnName, columnDefinition] of Object.entries(newColumns)) {
        if (!tableInfo[columnName]) {
          await queryInterface.addColumn(
            'watch_specifications',
            columnName,
            columnDefinition,
            { transaction }
          );
          console.log(`✓ Added column: ${columnName}`);
        } else {
          console.log(`ℹ Column already exists: ${columnName}`);
        }
      }

      await transaction.commit();
      console.log('✓ Migration completed successfully');

    } catch (error) {
      console.error('Migration failed:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const transaction = await queryInterface.sequelize.transaction();

      const columnsToRemove = [
        'case_shape',
        'case_weight',
        'strap_width',
        'dial_colour',
        'dial_crystal',
        'dial_hands_count',
        'movement_name',
        'movement_battery_type',
        'movement_manufacturing',
        'additional_features',
        'watertightness'
      ];

      for (const column of columnsToRemove) {
        try {
          await queryInterface.removeColumn('watch_specifications', column, { transaction });
          console.log(`✓ Removed column: ${column}`);
        } catch (error) {
          if (!error.message.includes('does not exist')) {
            throw error;
          }
          console.log(`ℹ Column already removed: ${column}`);
        }
      }

      await transaction.commit();
      console.log('✓ Rollback completed successfully');

    } catch (error) {
      console.error('Rollback failed:', error.message);
      throw error;
    }
  }
};

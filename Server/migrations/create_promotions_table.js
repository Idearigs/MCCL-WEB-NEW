'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('promotions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      discount_percentage: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      banner_text: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      show_popup: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      show_banner: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes
    await queryInterface.addIndex('promotions', ['is_active']);
    await queryInterface.addIndex('promotions', ['show_popup']);
    await queryInterface.addIndex('promotions', ['show_banner']);
    await queryInterface.addIndex('promotions', ['sort_order']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('promotions');
  }
};

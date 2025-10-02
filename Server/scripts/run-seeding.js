// Simple script to run seeding through the server context
const express = require('express');
const { seedHierarchicalCategories } = require('./seed-hierarchical-categories');

const runSeeding = async () => {
  try {
    console.log('Starting seeding process...');
    await seedHierarchicalCategories();
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  }
};

// Export for use in server endpoints
module.exports = { runSeeding };

// Run if called directly
if (require.main === module) {
  runSeeding();
}
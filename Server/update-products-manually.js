// Simple script to update products with ring types and metals for testing
require('dotenv').config();
const { Client } = require('pg');

const updateProducts = async () => {
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DATABASE || 'mcculloch_jewellers',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password'
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Get available ring types and metals
    const ringTypesResult = await client.query('SELECT id, name FROM ring_types LIMIT 3');
    const metalsResult = await client.query('SELECT id, name FROM product_metals LIMIT 3');

    console.log('Available ring types:', ringTypesResult.rows);
    console.log('Available metals:', metalsResult.rows);

    if (ringTypesResult.rows.length === 0 || metalsResult.rows.length === 0) {
      console.log('No ring types or metals found in database');
      return;
    }

    // Get all products
    const productsResult = await client.query('SELECT id, name, ring_type_id, metal_id FROM products');
    console.log(`Found ${productsResult.rows.length} products`);

    // Update products that don't have ring_type_id or metal_id
    for (let i = 0; i < productsResult.rows.length; i++) {
      const product = productsResult.rows[i];
      const ringType = ringTypesResult.rows[i % ringTypesResult.rows.length];
      const metal = metalsResult.rows[i % metalsResult.rows.length];

      let updates = [];
      let values = [];
      let paramCount = 1;

      if (!product.ring_type_id) {
        updates.push(`ring_type_id = $${paramCount++}`);
        values.push(ringType.id);
      }

      if (!product.metal_id) {
        updates.push(`metal_id = $${paramCount++}`);
        values.push(metal.id);
      }

      if (updates.length > 0) {
        values.push(product.id);
        const query = `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramCount}`;

        await client.query(query, values);
        console.log(`Updated "${product.name}" with ring type "${ringType.name}" and metal "${metal.name}"`);
      }
    }

    console.log('Successfully updated products!');
  } catch (error) {
    console.error('Error updating products:', error);
  } finally {
    await client.end();
  }
};

updateProducts();
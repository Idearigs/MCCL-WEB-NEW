require('dotenv').config();
const { Client } = require('pg');

const checkDatabase = async () => {
  const client = new Client({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check what tables exist
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📋 Tables in database:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check if admin_users table exists and show its structure
    const adminTable = tables.rows.find(row => row.table_name === 'admin_users');
    if (adminTable) {
      console.log(`\n🔍 Structure of ${adminTable.table_name}:`);
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [adminTable.table_name]);

      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });

      // Check existing admin users
      const users = await client.query(`SELECT email, role, is_active, created_at FROM ${adminTable.table_name} ORDER BY created_at;`);
      console.log(`\n👥 Existing admin users in ${adminTable.table_name}:`);
      if (users.rows.length === 0) {
        console.log('  - No admin users found');
      } else {
        users.rows.forEach(user => {
          console.log(`  - ${user.email} (${user.role}) - Active: ${user.is_active} - Created: ${user.created_at}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
};

checkDatabase();
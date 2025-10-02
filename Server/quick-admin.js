require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const createAdmin = async () => {
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

    const hashedPassword = await bcrypt.hash('admin123!', 12);

    const result = await client.query(`
      INSERT INTO admin_users (
        id,
        email,
        password,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        password = $2,
        role = $5,
        is_active = $6,
        updated_at = NOW()
      RETURNING email, role;
    `, ['admin@mcculloch.com', hashedPassword, 'Super', 'Admin', 'super_admin', true]);

    console.log('✅ Admin user created/updated:', result.rows[0]);
    console.log('📧 Email: admin@mcculloch.com');
    console.log('🔑 Password: admin123!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
};

createAdmin();
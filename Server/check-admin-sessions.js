const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'mcculloch_db',
  username: process.env.PG_USERNAME || 'postgres',
  password: process.env.PG_PASSWORD,
  dialect: 'postgres',
  logging: false
});

async function checkSessions() {
  try {
    console.log('Checking admin sessions...\n');

    const sessions = await sequelize.query(`
      SELECT
        s.id,
        s.admin_user_id,
        s.token_hash,
        s.is_active,
        s.expires_at,
        s.created_at,
        u.email,
        u.first_name,
        u.last_name
      FROM admin_sessions s
      JOIN admin_users u ON s.admin_user_id = u.id
      WHERE s.expires_at > NOW()
      ORDER BY s.created_at DESC
      LIMIT 5
    `);

    if (sessions[0].length === 0) {
      console.log('❌ No active sessions found');
    } else {
      console.log(`✓ Found ${sessions[0].length} active session(s):\n`);
      sessions[0].forEach((session, i) => {
        console.log(`[${i+1}] ${session.email} (${session.first_name} ${session.last_name})`);
        console.log(`    Token Hash: ${session.token_hash.substring(0, 16)}...`);
        console.log(`    Active: ${session.is_active}`);
        console.log(`    Expires: ${session.expires_at}`);
        console.log(`    Created: ${session.created_at}\n`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkSessions();

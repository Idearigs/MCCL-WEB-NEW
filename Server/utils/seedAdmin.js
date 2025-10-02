const { connectDatabases } = require('../config/database');
const { initializeModels } = require('../models');
const { getAdminModels } = require('../models/adminModels');

const seedAdminData = async () => {
  try {
    await connectDatabases();
    initializeModels();

    const { AdminUser } = getAdminModels();

    console.log('🔐 Starting admin seed...');

    // Check if admin users already exist
    const existingAdmins = await AdminUser.findAll();

    if (existingAdmins.length > 0) {
      console.log('⚠️  Admin users already exist. Skipping admin seed.');
      console.log('📧 Existing admin emails:', existingAdmins.map(admin => admin.email).join(', '));
      return;
    }

    // Create admin users
    const adminUsers = await AdminUser.bulkCreate([
      {
        email: 'admin@mcculloch.com',
        password: 'Admin123!',
        first_name: 'Super',
        last_name: 'Admin',
        role: 'super_admin',
        avatar: null,
        is_active: true
      },
      {
        email: 'manager@mcculloch.com',
        password: 'Manager123!',
        first_name: 'Store',
        last_name: 'Manager',
        role: 'admin',
        is_active: true
      },
      {
        email: 'editor@mcculloch.com',
        password: 'Editor123!',
        first_name: 'Content',
        last_name: 'Editor',
        role: 'editor',
        is_active: true
      }
    ]);

    console.log('✅ Admin users created successfully!');

    console.log(`
🎉 Admin seed completed!

👤 Admin Users Created:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email                    👤 Name           🔑 Role        🔐 Password
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
admin@mcculloch.com        Super Admin       super_admin    Admin123!
manager@mcculloch.com      Store Manager     admin          Manager123!
editor@mcculloch.com       Content Editor    editor         Editor123!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Admin Login URL: http://localhost:3000/admin/login
🔗 API Login Endpoint: POST http://localhost:5000/api/v1/admin/login

⚠️  IMPORTANT SECURITY NOTES:
- Change these default passwords immediately in production
- These are development credentials only
- Use strong passwords and enable 2FA in production
- Regularly audit admin user access

🚀 You can now:
1. Start your backend server: npm run dev (from Server directory)
2. Access admin login at: http://localhost:3000/admin/login
3. Use any of the above credentials to login
4. The super_admin has full access to all features
`);

  } catch (error) {
    console.error('❌ Admin seed failed:', error);
  }
};

// Run seed if file is executed directly
if (require.main === module) {
  seedAdminData().then(() => process.exit(0));
}

module.exports = { seedAdminData };
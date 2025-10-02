const bcrypt = require('bcryptjs');
const { connectDatabases } = require('./config/database');
const { Admin } = require('./models');

const createAdmin = async () => {
  try {
    await connectDatabases();
    console.log('Creating admin user...');

    const hashedPassword = await bcrypt.hash('admin123!', 12);

    const admin = await Admin.create({
      email: 'admin@mcculloch.com',
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'super_admin',
      is_active: true
    });

    console.log('✅ Admin user created successfully');
    console.log('Email: admin@mcculloch.com');
    console.log('Password: admin123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
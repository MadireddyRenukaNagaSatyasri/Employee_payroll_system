import dotenv from 'dotenv';
import connectDB, { disconnectDB } from '../config/db.js';
import Admin from '../models/Admin.js';

dotenv.config();

/**
 * Script to create the initial admin account.
 * Run via: node utils/seedAdmin.js
 */
const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@payroll.com').toLowerCase();
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@12345';
    const adminName = process.env.INITIAL_ADMIN_NAME || 'System Administrator';

    // Check if an admin already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`ℹ️ Admin account already exists for ${adminEmail}. Skipping seed.`);
      await disconnectDB();
      process.exit(0);
    }

    const newAdmin = await Admin.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'superadmin',
    });

    console.log('==============================================');
    console.log('✅ Initial Admin Account Created Successfully!');
    console.log(`   Name:     ${newAdmin.name}`);
    console.log(`   Email:    ${newAdmin.email}`);
    console.log(`   Role:     ${newAdmin.role}`);
    console.log(`   Password: (Configured in .env or default)`);
    console.log('==============================================');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error seeding admin: ${error.message}`);
    await disconnectDB();
    process.exit(1);
  }
};

seedAdmin();

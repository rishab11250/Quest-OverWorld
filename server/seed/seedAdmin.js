require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quest-overworld';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for admin creation...');

    // 1. Ensure dedicated admin account exists from environment configuration
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@overworld.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';
    const adminName = process.env.ADMIN_NAME || 'Guild Master Admin';

    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured in environment variables.');
    }

    const passwordHash = await User.hashPassword(adminPassword);

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        passwordHash,
        isAdmin: true,
      });
      console.log(`Created new admin account: ${adminEmail}`);
    } else {
      admin.name = adminName;
      admin.passwordHash = passwordHash;
      admin.isAdmin = true;
      await admin.save();
      console.log(`Updated existing admin account: ${adminEmail}`);
    }

    console.log('\n--- ADMIN SEED SUCCESSFUL ---');
    console.log(`Email: ${adminEmail}`);
    console.log(`Role:  Admin (Guild Master)`);
    console.log('-----------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  }
};

seedAdmin();

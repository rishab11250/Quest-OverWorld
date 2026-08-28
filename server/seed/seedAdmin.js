require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quest-overworld';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for admin creation...');

    // 1. Ensure dedicated admin account exists
    const adminEmail = 'admin@overworld.com';
    const adminPassword = 'adminpassword123';
    const passwordHash = await User.hashPassword(adminPassword);

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'Guild Master Admin',
        email: adminEmail,
        passwordHash,
        isAdmin: true,
      });
      console.log(`Created new admin account: ${adminEmail} / ${adminPassword}`);
    } else {
      admin.passwordHash = passwordHash;
      admin.isAdmin = true;
      await admin.save();
      console.log(`Updated existing admin account: ${adminEmail} / ${adminPassword}`);
    }

    // 2. Ensure test player account is a regular player
    await User.updateOne({ email: 'rishabtest@gmail.com' }, { isAdmin: false });
    console.log('Reset rishabtest@gmail.com to standard player role (isAdmin: false).');

    console.log('\n--- ADMIN CREDENTIALS ---');
    console.log('Email:    admin@overworld.com');
    console.log('Password: adminpassword123');
    console.log('Role:     Admin (Guild Master)');
    console.log('-------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  }
};

seedAdmin();

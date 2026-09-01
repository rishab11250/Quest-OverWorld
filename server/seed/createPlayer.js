require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createPlayer() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is required. Set it in server/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas...');

  const email = 'player@overworld.com';
  const password = 'playerpassword123';
  const name = 'Shadow Adventurer';

  let user = await User.findOne({ email });
  const passwordHash = await User.hashPassword(password);

  if (user) {
    user.name = name;
    user.passwordHash = passwordHash;
    user.isAdmin = false;
    await user.save();
    console.log('Updated existing player account:');
  } else {
    user = await User.create({
      name,
      email,
      passwordHash,
      isAdmin: false,
    });
    console.log('Created new player account:');
  }

  console.log('----------------------------');
  console.log('Player Email:   ', email);
  console.log('Player Password:', password);
  console.log('Player Name:    ', name);
  console.log('Role:            Player (isAdmin: false)');
  console.log('----------------------------');

  process.exit(0);
}

createPlayer().catch((err) => {
  console.error('Error creating player:', err);
  process.exit(1);
});

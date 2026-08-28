require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createPlayer() {
  const uri =
    process.env.MONGO_URI ||
    'mongodb://rishabchandgothiacg_db_user:rishab25nov@ac-dhjjvkk-shard-00-00.iwhvfnb.mongodb.net:27017,ac-dhjjvkk-shard-00-01.iwhvfnb.mongodb.net:27017,ac-dhjjvkk-shard-00-02.iwhvfnb.mongodb.net:27017/quest-overworld?ssl=true&replicaSet=atlas-mo37rj-shard-0&authSource=admin&appName=Cluster0';

  await mongoose.connect(uri);
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

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Quest = require('../models/Quest');
const Checkpoint = require('../models/Checkpoint');
const Team = require('../models/Team');

const sampleQuest = {
  name: 'The Legend of Old Campus',
  description:
    'An ancient mystery buried across historic quad grounds. Decipher the four ancient relics to unlock the founder’s secrets.',
  campus: 'Main Quad Campus',
  status: 'active',
  totalPoints: 700,
};

const sampleCheckpoints = [
  {
    order: 1,
    title: 'The Whispering Oak',
    clue: 'Seek the oldest oak near the northern library tower. Behind the copper plaque lies the secret crest.',
    latitude: 28.5458,
    longitude: 77.1926,
    radius: 50,
    qrCode: 'QST-CHK-01-OAK',
    points: 100,
  },
  {
    order: 2,
    title: 'Clocktower Steps',
    clue: 'Ascend to where time looks down upon the quad. Count thirty steps and search the western stone arch.',
    latitude: 28.5465,
    longitude: 77.1932,
    radius: 50,
    qrCode: 'QST-CHK-02-CLOCK',
    points: 150,
  },
  {
    order: 3,
    title: 'Alumni Fountain',
    clue: 'Where waters flow beneath the bronze griffin’s gaze, find the hidden rune inscribed in the pool rim.',
    latitude: 28.5472,
    longitude: 77.1918,
    radius: 50,
    qrCode: 'QST-CHK-03-FOUNTAIN',
    points: 200,
  },
  {
    order: 4,
    title: 'Founders Vault',
    clue: 'The ancient cornerstone holds the final sigil. Locate the 1892 inscription by the grand entrance.',
    latitude: 28.548,
    longitude: 77.194,
    radius: 50,
    qrCode: 'QST-CHK-04-FOUNDERS',
    points: 250,
  },
];

const seed = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || 'mongodb://localhost:27017/quest-overworld';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing quest and checkpoint data
    await Quest.deleteMany({});
    await Checkpoint.deleteMany({});
    console.log('Cleared existing quest and checkpoint data.');

    // Create Quest
    const quest = await Quest.create(sampleQuest);
    console.log(`Created Quest: ${quest.name} (${quest._id})`);

    // Create Checkpoints
    const createdCheckpoints = [];
    for (const cp of sampleCheckpoints) {
      const checkpoint = await Checkpoint.create({
        ...cp,
        questId: quest._id,
      });
      createdCheckpoints.push(checkpoint._id);
      console.log(`- Checkpoint ${cp.order}: ${cp.title} (${cp.points} PTS)`);
    }

    // Attach checkpoints to Quest
    quest.checkpoints = createdCheckpoints;
    await quest.save();

    // Link any existing teams to this active quest
    const teams = await Team.find({});
    for (const team of teams) {
      team.questId = quest._id;
      await team.save();
    }
    console.log(`Linked ${teams.length} team(s) to quest.`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();

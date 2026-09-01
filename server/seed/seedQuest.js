require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Quest = require('../models/Quest');
const Checkpoint = require('../models/Checkpoint');
const Team = require('../models/Team');

const crypto = require('crypto');

const sampleQuest = {
  name: 'The Chronicles of Parvat Patiya',
  description:
    'An ancient urban expedition across the historic squares, trading avenues, and garden plazas of Parvat Patiya, Surat.',
  campus: 'Parvat Patiya Realm · Surat',
  status: 'active',
  totalPoints: 700,
};

const sampleCheckpoints = [
  {
    order: 1,
    title: 'Parvat Patiya Gateway Arch',
    clue: 'Seek the grand gateway junction where the main avenue meets the eastern flyover arch. Behind the copper marker lies the secret beacon.',
    latitude: 21.1796,
    longitude: 72.8662,
    radius: 50,
    qrCode: crypto.randomBytes(8).toString('hex'),
    points: 100,
  },
  {
    order: 2,
    title: 'Model Town Garden Plaza',
    clue: 'Head northeast to where shady trees border the public garden square. Search near the stone seating pavilion.',
    latitude: 21.1815,
    longitude: 72.8685,
    radius: 50,
    qrCode: crypto.randomBytes(8).toString('hex'),
    points: 150,
  },
  {
    order: 3,
    title: 'Ambika Avenue Fountain Court',
    clue: 'Where the twin avenues cross and tree shade cools the square. Look behind the western planter wall.',
    latitude: 21.1775,
    longitude: 72.864,
    radius: 50,
    qrCode: crypto.randomBytes(8).toString('hex'),
    points: 200,
  },
  {
    order: 4,
    title: 'Surat Heritage Trading Vault',
    clue: 'The final sigil marks the guild hall cornerstone. Locate the inscription by the grand entrance pillar.',
    latitude: 21.183,
    longitude: 72.8635,
    radius: 50,
    qrCode: crypto.randomBytes(8).toString('hex'),
    points: 250,
  },
];

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri)
      throw new Error('MONGO_URI environment variable is required. Set it in server/.env');
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

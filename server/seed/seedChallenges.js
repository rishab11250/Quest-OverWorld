require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');

const sampleChallenges = [
  {
    title: 'Campus Mascot Selfie',
    description:
      'Snap a group selfie with the bronze campus griffin mascot in the main quad center.',
    category: 'photo',
    points: 150,
    status: 'active',
    verificationType: 'manual_review',
  },
  {
    title: 'Library Hidden Manuscript',
    description:
      'Solve the riddle: "I speak without a mouth and hear without ears." Locate the book titled "Chronicles of 1920" in the campus archives.',
    category: 'riddle',
    points: 200,
    status: 'active',
    verificationType: 'manual_review',
  },
  {
    title: 'Founding Year Trivia',
    description:
      'In what year was the first cornerstone of the north campus foundation building laid? (Enter 4-digit year)',
    category: 'trivia',
    points: 100,
    status: 'active',
    verificationType: 'auto_answer',
    answerKey: '1892',
  },
  {
    title: 'Guild Battle Cry',
    description: 'Write an epic 4-line adventuring cheer / rallying cry for your party.',
    category: 'creative',
    points: 250,
    status: 'active',
    verificationType: 'manual_review',
  },
];

const seedChallenges = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI environment variable is required. Set it in server/.env');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding challenges...');

    await Challenge.deleteMany({});
    console.log('Cleared existing challenges.');

    for (const c of sampleChallenges) {
      const created = await Challenge.create(c);
      console.log(
        `- Created Challenge: ${created.title} (${created.points} PTS) [${created.category}]`
      );
    }

    console.log('Challenge seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Challenge seeding failed:', error);
    process.exit(1);
  }
};

seedChallenges();

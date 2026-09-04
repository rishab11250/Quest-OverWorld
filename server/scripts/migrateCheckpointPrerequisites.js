require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Quest = require('../models/Quest');
const Checkpoint = require('../models/Checkpoint');

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not found in environment');
    }
    console.log('[Migration] Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('[Migration] Connected to MongoDB.');

    // Drop the old unique index { questId: 1, order: 1 } if it exists in MongoDB
    try {
      await Checkpoint.collection.dropIndex('questId_1_order_1');
      console.log('[Migration] Successfully dropped old unique index questId_1_order_1');
    } catch (indexErr) {
      console.log('[Migration] Index drop note:', indexErr.message);
    }

    const quests = await Quest.find().select('_id name');
    console.log(`[Migration] Found ${quests.length} quests to inspect.`);

    let totalUpdated = 0;

    for (const quest of quests) {
      const checkpoints = await Checkpoint.find({ questId: quest._id }).sort({ order: 1 });
      console.log(
        `[Migration] Quest "${quest.name}" (${quest._id}) has ${checkpoints.length} checkpoints.`
      );

      for (let i = 0; i < checkpoints.length; i++) {
        const cp = checkpoints[i];
        let expectedPrereqs = [];
        if (i > 0) {
          expectedPrereqs = [checkpoints[i - 1]._id];
        }

        cp.prerequisites = expectedPrereqs;
        await cp.save();
        totalUpdated++;
      }
    }

    console.log(
      `[Migration] Complete! Successfully migrated ${totalUpdated} checkpoints to linear prerequisite graph.`
    );
  } catch (error) {
    console.error('[Migration Error]', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('[Migration] Disconnected from MongoDB.');
  }
};

if (require.main === module) {
  migrate();
}

module.exports = migrate;

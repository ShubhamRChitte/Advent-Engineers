const mongoose = require('mongoose');
const { PreTestBatchModel } = require('./models/PreTestBatchModel');
require('dotenv').config();

const fixBatches = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/advent-engineers');
    console.log('Connected to MongoDB');

    const result = await PreTestBatchModel.updateMany(
      { numberOfCores: 1, passedCount: 0, failedCount: 0 },
      { $set: { status: "IN_PROGRESS" } }
    );

    console.log(`Updated ${result.modifiedCount} batches to IN_PROGRESS`);

    // Also fix any batches with 'TESTING' status to 'IN_PROGRESS' since we changed the enum
    const result2 = await PreTestBatchModel.updateMany(
      { status: "TESTING" },
      { $set: { status: "IN_PROGRESS" } }
    );
    console.log(`Updated ${result2.modifiedCount} batches from TESTING to IN_PROGRESS`);

    process.exit(0);
  } catch (error) {
    console.error('Error fixing batches:', error);
    process.exit(1);
  }
};

fixBatches();

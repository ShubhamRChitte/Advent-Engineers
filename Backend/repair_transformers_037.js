require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');

const uri = process.env.MONGO_URL;

async function repairTransformers() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const jobId = "JOB-2026-037";
        console.log(`Repairing transformers for Job ID: ${jobId}`);

        // Find transformers for this job
        const transformers = await TransformerModel.find({ jobId: jobId });
        console.log(`Found ${transformers.length} transformers.`);

        if (transformers.length === 0) {
            console.log("No transformers found. Exiting.");
            return;
        }

        // Update them to 'secondary'
        const result = await TransformerModel.updateMany(
            { jobId: jobId, currentStage: 'core' },
            { $set: { currentStage: 'secondary' } }
        );

        console.log(`Update Result: matched ${result.matchedCount}, modified ${result.modifiedCount}`);

        // Verify
        const updated = await TransformerModel.find({ jobId: jobId });
        updated.forEach(t => {
            console.log(`Transformer ${t.uniqueId} is now at stage: ${t.currentStage}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

repairTransformers();

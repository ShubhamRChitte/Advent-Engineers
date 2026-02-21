const mongoose = require('mongoose');
require('dotenv').config();

const { TransformerModel } = require('./models/TransformerModel');

const mongoURI = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/advent-db";

const checkStages = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB");

        const jobId = "JOB-2026-072";

        // Find transformers by Job ID (since they should have it) or we find order first
        // Let's find via Order ID from previous debug
        const orderId = "698f08869174aef4f04295ce";

        const fs = require('fs');
        const transformers = await TransformerModel.find({ orderId: orderId });
        console.log(`Found ${transformers.length} transformers.`);
        fs.writeFileSync('stages.json', JSON.stringify(transformers, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

checkStages();

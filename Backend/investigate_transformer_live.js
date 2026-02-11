require("dotenv").config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');

const uri = process.env.MONGO_URL;

async function run() {
    try {
        if (!uri) throw new Error("MONGO_URL is missing in .env");

        await mongoose.connect(uri);
        console.log("Connected to Atlas DB");

        // Fuzzy search
        const target = "JOB-2026-038";
        const allTransformers = await TransformerModel.find({ uniqueId: { $regex: target, $options: 'i' } }).lean();

        console.log(`Found ${allTransformers.length} matching transformers.`);

        if (allTransformers.length > 0) {
            const t = allTransformers[0];
            console.log("--- DETAILED DUMP for " + t.uniqueId + " ---");
            console.log("Secondary Status:", t.testHistory?.secondary_test?.status);
            console.log("Secondary Metering Results:", JSON.stringify(t.testHistory?.secondary_test?.metering_results, null, 2));
            console.log("Secondary PS Results:", JSON.stringify(t.testHistory?.secondary_test?.ps_results, null, 2));
            console.log("Secondary Protection Results:", JSON.stringify(t.testHistory?.secondary_test?.protection_results, null, 2));
        } else {
            console.log("No match found for " + target);
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

run();

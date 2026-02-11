require("dotenv").config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');

const uri = process.env.MONGO_URL;

async function run() {
    try {
        await mongoose.connect(uri);
        console.log("Connected.");
        const targetId = "TR-JOB-2026-038-004";
        const doc = await TransformerModel.findOne({ uniqueId: targetId });

        if (!doc) {
            console.log("Not Found.");
            return;
        }

        console.log("Found. Current Status:", doc.testHistory?.secondary_test?.status);

        // Initialize if needed
        if (!doc.testHistory.secondary_test) doc.testHistory.secondary_test = {};

        // DUMMY PS INJECTION
        const dummyPS = {
            ratioValue: "TEST-RATIO",
            turnRatioError: "0.1",
            resistance: "10",
            vk: "100",
            vkVal: "110",
            iexVk: "0.01",
            iex11Vk: "0.02"
        };

        doc.testHistory.secondary_test.ps_results = [dummyPS];
        doc.testHistory.secondary_test.status = "Debug-PS-Write";
        doc.markModified('testHistory');

        const saved = await doc.save();
        console.log("Save Completed.");
        console.log("New Status:", saved.testHistory.secondary_test.status);
        console.log("PS Results:", JSON.stringify(saved.testHistory.secondary_test.ps_results));

    } catch (err) {
        console.error("Save Error:", err.message);
        if (err.errors) console.error("Validation Errors:", JSON.stringify(err.errors, null, 2));
    } finally {
        mongoose.disconnect();
    }
}

run();

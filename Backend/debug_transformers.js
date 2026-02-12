<<<<<<< HEAD

const mongoose = require('mongoose');
require("dotenv").config();
const { TransformerModel } = require('./models/TransformerModel');

// Use the ENV variable or fallback (but we know ENV is what we need)
const MONGO_URI = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/advent_db";

async function runDebug() {
    try {
        console.log("Connecting to:", MONGO_URI.substring(0, 20) + "...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");

        const orderId = "6983458827d81a1baa36beff"; // ID from user JSON

        const transformers = await TransformerModel.find({ orderId: orderId });
        console.log(`Found ${transformers.length} transformers for order ${orderId}`);

        if (transformers.length > 0) {
            console.log("First Transformer assignments:", transformers[0].assignments);

            // Check counts
            const assignedToRahul = transformers.filter(t => t.assignments && t.assignments.core_tester === "Rahul Sharma");
            console.log(`Assigned to Rahul Sharma: ${assignedToRahul.length}`);

            const coreStage = transformers.filter(t => t.currentStage === "core");
            console.log(`In 'core' stage: ${coreStage.length}`);
        } else {
            const count = await TransformerModel.countDocuments({});
            console.log(`Total Transformers in DB: ${count}`);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

runDebug();
=======
const mongoose = require('mongoose');
const { TransformerSchema } = require('./schema/TransformerSchema');

const TransformerModel = mongoose.model('Transformer', TransformerSchema);

const MONGO_URL = 'mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster';

async function inspectTransformers() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB.");

        // Specific check for JOB-2026-049
        const jobTransformers = await TransformerModel.find({
            jobId: "JOB-2026-049"
        }).lean();

        console.log(`\nFound ${jobTransformers.length} transformers for JOB-2026-049.`);
        jobTransformers.forEach(t => {
            console.log(`ID: ${t.uniqueId} | Core Tester: ${t.assignments?.core_tester}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

inspectTransformers();
>>>>>>> dd2b983ae0fe7022e4ed6b0d051300ff7bf8bcb1

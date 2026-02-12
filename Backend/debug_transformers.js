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

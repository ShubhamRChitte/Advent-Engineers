const mongoose = require('mongoose');
const { Schema } = mongoose;

const MONGO_URL = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";

const TransformerSchema = new Schema({
    uniqueId: String,
    testHistory: { type: Schema.Types.Mixed }
}, { strict: false });

const TransformerModel = mongoose.model('Transformer_Inspect_Broad_2', TransformerSchema, 'transformers');

async function run() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB");

        // Find ANY transformer with testHistory
        const transformers = await TransformerModel.find({
            "testHistory": { $exists: true }
        }).limit(3).lean();

        console.log(`Found ${transformers.length} transformers.`);

        transformers.forEach(t => {
            console.log(`\nTransformer: ${t.uniqueId}`);
            // console.log("testHistory keys:", Object.keys(t.testHistory || {}));
            if (t.testHistory && t.testHistory.core_test) {
                const ct = t.testHistory.core_test;
                if (ct.protection_results) {
                    console.log("protection_results found. Length:", ct.protection_results.length);
                    if (ct.protection_results.length > 0) {
                        console.log("First item:", JSON.stringify(ct.protection_results[0], null, 2));
                    }
                } else {
                    console.log("No protection_results in core_test");
                }
            } else {
                console.log("No core_test in testHistory");
            }
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
}

run();

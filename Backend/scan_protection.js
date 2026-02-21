const mongoose = require('mongoose');
const { Schema } = mongoose;

const MONGO_URL = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";

const TransformerSchema = new Schema({
    uniqueId: String,
    testHistory: { type: Schema.Types.Mixed }
}, { strict: false });

const TransformerModel = mongoose.model('Transformer_Inspect_Scan', TransformerSchema, 'transformers');

async function run() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB");

        // Scan up to 100 transformers
        const transformers = await TransformerModel.find({
            "testHistory.core_test.protection_results": { $exists: true, $not: { $size: 0 } }
        }).limit(10).lean();

        console.log(`Found ${transformers.length} transformers with protection results.`);

        transformers.forEach(t => {
            console.log(`\nTransformer: ${t.uniqueId}`);
            const results = t.testHistory.core_test.protection_results;
            console.log(`Length: ${results.length}`);
            console.log("First item:", JSON.stringify(results[0], null, 2));
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
}

run();

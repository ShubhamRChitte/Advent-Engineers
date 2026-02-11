const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');

const MONGO_URI = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";

async function debugTransformer() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // Find the most recently updated transformer in secondary stage
        const transformers = await TransformerModel.find({})
            .sort({ updatedAt: -1 })
            .limit(3);

        console.log(`Found ${transformers.length} transformers`);

        transformers.forEach(t => {
            console.log(`\nID: ${t.uniqueId}`);
            console.log('Stage:', t.currentStage);
            console.log('Secondary Test History:', JSON.stringify(t.testHistory?.secondary_test, null, 2));
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.connection.close();
    }
}

debugTransformer();

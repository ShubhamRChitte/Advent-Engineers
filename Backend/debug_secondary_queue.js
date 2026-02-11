const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel'); // Adjust path
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URL || "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("Connected to DB...");

        // 1. Count secondary transformers
        const count = await TransformerModel.countDocuments({ currentStage: 'secondary' });
        console.log(`Total Transformers in 'secondary' stage: ${count}`);

        if (count > 0) {
            // 2. List Details
            const transformers = await TransformerModel.find({ currentStage: 'secondary' });
            transformers.forEach(t => {
                console.log(`- ${t.uniqueId} (Order: ${t.orderId})`);
                console.log(`  Assignments:`, t.assignments);
            });
        } else {
            // Check Core Stage just in case
            const coreCount = await TransformerModel.countDocuments({ currentStage: 'core' });
            console.log(`Total Transformers in 'core' stage: ${coreCount}`);
        }

        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

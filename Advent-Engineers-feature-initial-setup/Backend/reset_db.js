const mongoose = require('mongoose');
require("dotenv").config();
const { TransformerModel } = require("./models/TransformerModel");
const uri = process.env.MONGO_URL;

mongoose.connect(uri)
    .then(async () => {
        console.log("Connected to MongoDB for RESET...");

        // 1. Delete all
        const deleteResult = await TransformerModel.deleteMany({});
        console.log(`Deleted ${deleteResult.deletedCount} documents.`);

        // 2. We need to run the seeding logic from index.js
        // Since index.js starts an express server, we can't just 'require' it easily to run lines.
        // Instead we will instruct the user to hit the endpoint, OR we can copy the seeding logic here.
        // copying logic is safer and self-contained.

        console.log("Please run the seed endpoint: http://localhost:3002/addTransformerReadingData");

        mongoose.connection.close();
    })
    .catch(err => {
        console.error("Error:", err);
        process.exit(1);
    });

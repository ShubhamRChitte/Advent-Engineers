const mongoose = require('mongoose');
require("dotenv").config();

const uri = process.env.MONGO_URL;

const TransformerSchema = new mongoose.Schema({
    uniqueId: String,
    testHistory: {
        secondary_login: mongoose.Schema.Types.Mixed,
        primary_login: mongoose.Schema.Types.Mixed,
        final_test_login: mongoose.Schema.Types.Mixed
    }
}, { strict: false });

const TransformerModel = mongoose.model("Transformer", TransformerSchema);

mongoose.connect(uri)
    .then(async () => {
        console.log("Connected to MongoDB for checking...");

        const docs = await TransformerModel.find({}, 'uniqueId');
        if (docs.length === 0) {
            console.log("No transformer documents found.");
        } else {
            console.log(`Found ${docs.length} Transformers:`);
            docs.forEach(d => console.log(` - ${d.uniqueId}`));
        }

        mongoose.connection.close();
    })
    .catch(err => {
        console.error("Error:", err);
        process.exit(1);
    });

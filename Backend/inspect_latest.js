const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');
require("dotenv").config();

const uri = process.env.MONGO_URL;

mongoose.connect(uri).then(async () => {
    console.log("Connected to DB...");

    // 1. Get latest Order
    const latestOrder = await OrderModel.findOne().sort({ createdAt: -1 });
    console.log("Latest Order:", latestOrder?.jobId, latestOrder?._id);

    if (latestOrder) {
        // 2. Get Transformers for this Order
        const transformers = await TransformerModel.find({ orderId: latestOrder._id });
        console.log(`Found ${transformers.length} transformers.`);

        if (transformers.length > 0) {
            console.log("Sample Transformer 1 assignments:", JSON.stringify(transformers[0].assignments, null, 2));
            console.log("Sample Transformer 1 Stage:", transformers[0].currentStage);
            console.log("Sample Transformer 1 UniqueID:", transformers[0].uniqueId);
            console.log("ALL Transformer UniqueIDs:", transformers.map(t => t.uniqueId));
        } else {
            console.log("No transformers found for this order!");
        }
    }

    mongoose.connection.close();
}).catch(err => {
    console.error(err);
    mongoose.connection.close();
});

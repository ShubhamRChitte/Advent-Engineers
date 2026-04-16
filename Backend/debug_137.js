require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

async function debug137() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const order = await OrderModel.findOne({ jobId: "JOB-2026-137" });
        if (!order) return console.log("Order 137 not found");

        console.log("Order 137 ID:", order._id);

        const transformers = await TransformerModel.find({ orderId: order._id }).lean();
        console.log(`Transformers found for 137: ${transformers.length}`);

        transformers.forEach(t => {
            console.log(`TR: ${t.uniqueId} | stage: ${t.currentStage} | primary_status: ${t.testHistory?.primary_test?.status}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
debug137();

require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

async function testFinal() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const order = await OrderModel.findOne({ jobId: "JOB-2026-137" });
        if (!order) return console.log("Order 137 not found");

        const orderIdStr = order._id.toString();
        const query = {
            orderId: orderIdStr,
            "testHistory.primary_test.status": "Completed"
        };
        
        console.log("Running Query with orderId:", orderIdStr);
        const transformers = await TransformerModel.find(query).lean();
        console.log("Query Results Count for 137:", transformers.length);
        
        transformers.forEach(t => {
            console.log(`- TR ID: ${t.uniqueId} | currentStage: ${t.currentStage}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
testFinal();

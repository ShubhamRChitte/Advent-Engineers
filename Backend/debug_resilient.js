require('dotenv').config();
const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');
const { TransformerModel } = require('./models/TransformerModel');

async function debugFinal() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        
        const jobId = "JOB-2026-137";
        const order = await OrderModel.findOne({ jobId: jobId }).lean();
        if (!order) {
            console.log(`Order not found for Job: ${jobId}`);
            return;
        }

        console.log(`Order Found: ${order.jobId}`);
        console.log(`- _id: ${order._id}`);
        console.log(`- type: ${typeof order._id}`);

        // Replicate backend logic
        const queryOrderId = order._id;
        const jobNo = order.jobId;

        const query = {
            $or: [
                { orderId: queryOrderId },
                { jobId: jobNo }
            ],
            "testHistory.primary_test.status": "Completed"
        };
        
        console.log("Query:", JSON.stringify(query, null, 2));
        
        const transformers = await TransformerModel.find(query).lean();
        console.log(`Transformers found: ${transformers.length}`);
        
        transformers.forEach(t => {
            console.log(`- TR: ${t.uniqueId} | orderId in TR: ${t.orderId} | stage: ${t.currentStage}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
debugFinal();

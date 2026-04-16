require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

async function testFix() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        
        // 1. Find the current Order for JOB-2026-137
        const order = await OrderModel.findOne({ jobId: "JOB-2026-137" });
        if (!order) return console.log("Order 137 not found");
        
        const orderId = order._id;
        const jobNo = order.jobId;
        
        console.log(`Testing Fix for Job: ${jobNo} (Active Order ID: ${orderId})`);

        // 2. Replicate the NEW backend query (OR match on orderId or jobId)
        const query = {
            $or: [
                { orderId: orderId },
                { jobId: jobNo }
            ],
            "testHistory.primary_test.status": "Completed"
        };
        
        const transformers = await TransformerModel.find(query).lean();
        console.log(`Query RESULTS: Found ${transformers.length} units.`);
        
        transformers.forEach(t => {
            console.log(`- TR: ${t.uniqueId} | current orderId in Doc: ${t.orderId}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
testFix();

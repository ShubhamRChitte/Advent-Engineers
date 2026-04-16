require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

async function debugHeating() {
    try {
        const uri = process.env.MONGO_URL;
        console.log("Connecting to:", uri.split('@')[1]); // Log only the cluster part for security
        await mongoose.connect(uri);
        console.log("Connected to DB");

        const jobId = "JOB-2026-138";
        const order = await OrderModel.findOne({ jobId: jobId });
        if (!order) {
            console.log("Order not found:", jobId);
            // Try partial match
            const allOrders = await OrderModel.find({ jobId: { $regex: '138' } });
            console.log("Partial matches for '138':", allOrders.map(o => o.jobId));
            return;
        }

        console.log("Order found:", order._id, order.jobId);

        const allTransformers = await TransformerModel.find({ orderId: order._id }).lean();
        console.log(`Total Transformers found for orderId ${order._id}:`, allTransformers.length);

        allTransformers.forEach(t => {
            console.log(`\nTransformer: ${t.uniqueId}`);
            console.log(`- currentStage: ${t.currentStage}`);
            console.log(`- Primary Test Status: ${t.testHistory?.primary_test?.status}`);
            
            const heatingEligible = t.testHistory?.primary_test?.status === "Completed" && 
                                   ["primary", "heating", "final", "shipped"].includes(t.currentStage);
            console.log(`- Eligible for Heating Query: ${heatingEligible}`);
            
            if (t.processHistory?.heatingRecord) {
                console.log(`- Heating Record Status: ${t.processHistory.heatingRecord[0]?.status}`);
            }
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

debugHeating();

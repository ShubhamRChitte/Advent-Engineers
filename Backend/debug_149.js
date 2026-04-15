require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

async function debugOrder() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        
        const jobId = "JOB-2026-149";
        const order = await OrderModel.findOne({ jobId });
        if (!order) {
            console.log(`Order ${jobId} not found`);
            return;
        }
        
        console.log(`Order found: ${order._id} | jobId: ${order.jobId}`);
        
        const transformers = await TransformerModel.find({ 
            $or: [
                { orderId: order._id },
                { jobId: jobId }
            ]
        }).lean();
        
        console.log(`Found ${transformers.length} transformers for this order.`);
        
        transformers.forEach(t => {
            console.log(`--- Transformer ${t.uniqueId} ---`);
            console.log(`Stage: ${t.currentStage}`);
            console.log(`Primary status: ${t.testHistory?.primary_test?.status}`);
            console.log(`PT status: ${t.testHistory?.pt_test?.status}`);
            console.log(`PT History: ${t.testHistory?.pt_test ? JSON.stringify(t.testHistory.pt_test).substring(0, 100) + '...' : 'None'}`);
            console.log(`OrderId in DB: ${t.orderId} (Type: ${typeof t.orderId})`);
            
            const matchesCriteria = (
                ["heating", "final", "shipped"].includes(t.currentStage) ||
                t.testHistory?.primary_test?.status === "Completed" ||
                t.testHistory?.pt_test?.status === "Completed"
            );
            console.log(`Matches heating criteria: ${matchesCriteria}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
debugOrder();

require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

async function testCompletedList() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        
        console.log("--- Testing Completed Heating Orders List ---");
        
        const query = {
            currentStage: { $in: ["final", "shipped", "completed", "admin_review", "pt"] },
            "processHistory.heatingRecord.0": { $exists: true }
        };

        const transformers = await TransformerModel.find(query).populate('orderId').lean();
        console.log(`Found ${transformers.length} Transformers with Heating Records.`);

        const ordersMap = new Map();
        for (const t of transformers) {
            let order = t.orderId;
            
            // If primary link is broken, fall back to Job ID to find parent order
            if (!order && t.jobId) {
                console.log(`[DEBUG] Broken ID link for transformer ${t.uniqueId}. Falling back to Job: ${t.jobId}`);
                order = await OrderModel.findOne({ jobId: t.jobId }).lean();
            }

            if (order && !ordersMap.has(order._id.toString())) {
                ordersMap.set(order._id.toString(), order);
            }
        }

        const orders = Array.from(ordersMap.values());
        console.log(`Unique Orders Found: ${orders.length}`);
        
        orders.forEach(o => {
            console.log(`- Order: ${o.jobId} | ID: ${o._id}`);
        });

        const has137 = orders.some(o => o.jobId === "JOB-2026-137");
        const has138 = orders.some(o => o.jobId === "JOB-2026-138");
        
        console.log(`Result: ${has137 && has138 ? "PASSED" : "FAILED"} (Job 137: ${has137}, Job 138: ${has138})`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
testCompletedList();

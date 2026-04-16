require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

async function testQuery() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        
        // Find the order first
        const order = await OrderModel.findOne({ jobId: /138/i });
        if (!order) {
            console.log("No order found matching '138'");
            const recent = await OrderModel.find().sort({createdAt: -1}).limit(5);
            console.log("Recent Job IDs:", recent.map(o => o.jobId));
            return;
        }
        
        console.log("Found Order:", order.jobId, "(_id:", order._id, ")");
        
        const query = {
            orderId: order._id,
            "testHistory.primary_test.status": "Completed",
            currentStage: { $in: ["primary", "heating", "final", "shipped"] }
        };
        
        const transformers = await TransformerModel.find(query).lean();
        console.log("Query Results Count:", transformers.length);
        
        if (transformers.length === 0) {
            console.log("Checking why 0 results...");
            const allForOrder = await TransformerModel.find({ orderId: order._id }).lean();
            console.log(`Total for this order: ${allForOrder.length}`);
            allForOrder.forEach(t => {
                console.log(`TR: ${t.uniqueId} | stage: ${t.currentStage} | primary_status: ${t.testHistory?.primary_test?.status}`);
            });
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
testQuery();

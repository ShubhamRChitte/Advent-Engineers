require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

async function testQuery() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        
        // Find the order first
        const order = await OrderModel.findOne({ jobId: /138/i });
        if (!order) return console.log("No order found matching '138'");
        
        console.log("Found Order:", order.jobId, "(_id:", order._id, ")");
        
        // REPLICATE BACKEND: use a STRING for orderId
        const orderIdStr = order._id.toString(); 
        
        const query = {
            orderId: orderIdStr, // STRING
            "testHistory.primary_test.status": "Completed",
            currentStage: { $in: ["primary", "heating", "final", "shipped"] }
        };
        
        console.log("Running Query with STRING orderId:", orderIdStr);
        const transformers = await TransformerModel.find(query).lean();
        console.log("Query Results Count:", transformers.length);
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
testQuery();

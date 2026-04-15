require('dotenv').config();
const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');
const { TransformerModel } = require('./models/TransformerModel');

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to DB");
        
        // Find an order that is in heating stage
        const order = await OrderModel.findOne({ currentStage: 'heating' }).sort({ createdAt: -1 });
        if (!order) {
            console.log("No orders in 'heating' stage found.");
            // List some recent orders to see their stages
            const recent = await OrderModel.find().sort({ createdAt: -1 }).limit(5);
            recent.forEach(o => console.log(`Order ${o.jobId}: stage=${o.currentStage}, heating_comp=${o.completionStages?.heating}`));
        } else {
            console.log(`Analyzing Order ${order.jobId}:`);
            console.log(`- currentStage: ${order.currentStage}`);
            console.log(`- completionStages.heating: ${order.completionStages?.heating}`);
            
            const transformers = await TransformerModel.find({ orderId: order._id }).limit(5);
            console.log(`- Transformers (sample):`);
            transformers.forEach(t => console.log(`  - ${t.uniqueId}: stage=${t.currentStage}`));
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
check();

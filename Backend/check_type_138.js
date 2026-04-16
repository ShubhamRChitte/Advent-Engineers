require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

async function checkType() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const order = await OrderModel.findOne({ jobId: /138/i });
        if (!order) return console.log("Order not found");

        const transformers = await TransformerModel.find({ jobId: order.jobId }).lean();
        console.log(`Transformers found: ${transformers.length}`);
        
        transformers.forEach(t => {
            console.log(`TR: ${t.uniqueId}`);
            console.log(`- orderId value: ${t.orderId}`);
            console.log(`- orderId type: ${typeof t.orderId}`);
            console.log(`- is ObjectId: ${t.orderId instanceof mongoose.Types.ObjectId}`);
            console.log(`- currentStage: ${t.currentStage}`);
            console.log(`- primary test status: ${t.testHistory?.primary_test?.status}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
checkType();

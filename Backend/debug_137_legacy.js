require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

async function debug137Legacy() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const order = await OrderModel.findOne({ jobId: "JOB-2026-137" });
        if (!order) return console.log("Order 137 not found");

        console.log("Order ID:", order._id);
        
        const byId = await TransformerModel.find({ orderId: order._id }).lean();
        console.log(`Transformers found by ObjectId: ${byId.length}`);

        const byJobIdStr = await TransformerModel.find({ orderId: "JOB-2026-137" }).lean();
        console.log(`Transformers found by string JobID: ${byJobIdStr.length}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
debug137Legacy();

const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');
require('dotenv').config();

async function debugJob144() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const jobId = "JOB-2026-144";
    const order = await OrderModel.findOne({ jobId });
    if (!order) {
        console.log("Order 144 not found");
        return;
    }

    console.log(`Order Info: id=${order._id}, jobId=${order.jobId}, currentStage=${order.currentStage}`);
    console.log(`Completion Stages:`, order.completionStages);

    const transformers = await TransformerModel.find({ jobId });
    console.log(`Found ${transformers.length} transformers for Job 144`);

    transformers.forEach(t => {
        console.log(`Unit: ${t.uniqueId}, orderId=${t.orderId}, currentStage=${t.currentStage}, primaryStatus=${t.testHistory?.primary_test?.status}`);
    });

    const pendingPrimary = await TransformerModel.countDocuments({
        orderId: order._id,
        currentStage: "primary"
    });
    console.log(`Count of units for order._id in 'primary' stage: ${pendingPrimary}`);

    const pendingPrimaryJobId = await TransformerModel.countDocuments({
        jobId: order.jobId,
        currentStage: "primary"
    });
    console.log(`Count of units for order.jobId in 'primary' stage: ${pendingPrimaryJobId}`);

    mongoose.disconnect();
}

debugJob144();

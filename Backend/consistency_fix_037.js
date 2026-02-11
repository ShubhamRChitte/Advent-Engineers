require('dotenv').config();
const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');
const { TransformerModel } = require('./models/TransformerModel');

const uri = process.env.MONGO_URL;

async function checkAndFixOrder() {
    try {
        await mongoose.connect(uri);

        const jobId = "JOB-2026-037";
        const order = await OrderModel.findOne({ jobId });

        if (!order) {
            console.log("Order not found");
            return;
        }

        console.log(`Order ${jobId} Stage: ${order.currentStage}`);

        // Check transformers
        const transformers = await TransformerModel.find({ jobId });
        const stages = transformers.map(t => t.currentStage);
        const allSecondary = stages.every(s => s === 'secondary');

        console.log(`Transformer Stages: ${JSON.stringify(stages)}`);

        if (allSecondary && order.currentStage === 'core') {
            console.log("Inconsistency detected! Updating Order to 'secondary'...");
            order.currentStage = 'secondary';
            order.status = 'Core Testing Completed';
            if (!order.completionStages) order.completionStages = {};
            order.completionStages.core = true;

            await order.save();
            console.log("Order updated successfully.");
        } else {
            console.log("Order is consistent or not ready for update.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkAndFixOrder();

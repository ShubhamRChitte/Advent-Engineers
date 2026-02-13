const mongoose = require('mongoose');
require('dotenv').config();

const { OrderModel } = require('./models/OrderModel');
const { TransformerModel } = require('./models/TransformerModel');

async function debugTransformers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const jobId = "JOB-2026-052"; // From screenshot
        console.log(`Searching for Order: ${jobId}`);

        const order = await OrderModel.findOne({ jobId: jobId }); // Try jobId field first

        let foundOrder = order;
        if (!foundOrder) {
            console.log("Order not found by jobId, trying orderId...");
            foundOrder = await OrderModel.findOne({ orderId: jobId });
        }

        if (!foundOrder) {
            console.log("Order NOT FOUND!");
            return;
        }

        console.log(`Found Order: _id=${foundOrder._id}, jobId=${foundOrder.jobId}, orderId=${foundOrder.orderId}`);

        // Check Transformers linked by _id
        console.log(`Checking transformers with orderId = ${foundOrder._id}`);
        const transformersById = await TransformerModel.find({ orderId: foundOrder._id });
        console.log(`Found ${transformersById.length} transformers linked by _id.`);

        // Check Transformers linked by string ID (just in case)
        console.log(`Checking transformers with orderId = "${foundOrder._id.toString()}" (string)`);
        // mongoose handles casting automatically usually, but let's see.

        if (transformersById.length === 0) {
            console.log("DUMPING ONE RANDOM TRANSFORMER TO SEE SCHEMA:");
            const randomT = await TransformerModel.findOne();
            if (randomT) {
                console.log(JSON.stringify(randomT, null, 2));
            }
        } else {
            console.log("Sample Transformer:", transformersById[0].uniqueId);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

debugTransformers();

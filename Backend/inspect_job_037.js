require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

const uri = process.env.MONGO_URL;

async function inspectOrder() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const order = await OrderModel.findOne({ jobId: "JOB-2026-037" });
        if (!order) {
            console.log("Order JOB-2026-037 not found!");
            return;
        }
        console.log(`Order Found: ${order.jobId}, ID: ${order._id}`);
        console.log(`Order Stage: ${order.currentStage}`);
        console.log(`Order Status: ${order.status}`);

        const transformers = await TransformerModel.find({ orderId: order._id });
        console.log(`Found ${transformers.length} transformers.`);

        const stageCounts = {};
        transformers.forEach(t => {
            stageCounts[t.currentStage] = (stageCounts[t.currentStage] || 0) + 1;
        });
        console.log("Transformer Stages Distribution:", stageCounts);

        if (transformers.length > 0) {
            console.log("Sample Transformer:", JSON.stringify(transformers[0], null, 2));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

const fs = require('fs');
const util = require('util');
const log_file = fs.createWriteStream(__dirname + '/inspect_out.txt', { flags: 'w' });
const log_stdout = process.stdout;

console.log = function (d) { //
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
};

inspectOrder();

const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');
const { TransformerModel } = require('./models/TransformerModel');
const fs = require('fs');

const MONGO_URI = 'mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster'; // Updated URI

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB (Remote)');

        const order = await OrderModel.findOne({ jobId: /2026-073/ });
        if (!order) {
            console.log('Order 073 still not found even with remote DB!');
            return;
        }

        let output = '';
        output += `Order Found: ${order._id} ${order.jobId}\n`;
        output += `Assignments: ${JSON.stringify(order.assignments, null, 2)}\n`;

        const transformers = await TransformerModel.find({ orderId: order._id });
        output += `Found ${transformers.length} transformers linked to this order.\n`;

        transformers.forEach(t => {
            output += `Unit: ${t.uniqueId} | Stage: ${t.currentStage} | Status: ${t.status || 'undefined'}\n`;
        });

        fs.writeFileSync('order_73_dump.txt', output);
        console.log("Dump written to order_73_dump.txt");

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();

const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

async function debug() {
    const uri = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const jobId = 'JOB-2026-139';
    const order = await OrderModel.findOne({ jobId }).lean();
    console.log(`Order ID Type: ${typeof order?._id}, Value: ${order?._id}`);

    const transformers = await TransformerModel.find({ jobId }).lean();
    console.log(`Found ${transformers.length} transformers for Job: ${jobId}`);

    transformers.forEach(t => {
        console.log(`Transformer: ${t.uniqueId}`);
        console.log(`  orderId in DB: ${t.orderId} (Type: ${typeof t.orderId})`);
        console.log(`  Stage: ${t.currentStage}`);
    });

    process.exit(0);
}
debug();

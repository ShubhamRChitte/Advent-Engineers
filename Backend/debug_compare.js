const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

async function debug() {
    const uri = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";
    await mongoose.connect(uri);
    const order = await OrderModel.findOne({ jobId: 'JOB-2026-139' }).lean();
    console.log('Order:', JSON.stringify(order, null, 2));
    
    const t = await TransformerModel.findOne({ jobId: 'JOB-2026-139' }).lean();
    console.log('Transformer:', JSON.stringify({
        uniqueId: t.uniqueId,
        orderId: t.orderId,
        jobId: t.jobId,
        currentStage: t.currentStage,
        primaryStatus: t.testHistory.primary_test?.status
    }, null, 2));
    
    process.exit(0);
}
debug();

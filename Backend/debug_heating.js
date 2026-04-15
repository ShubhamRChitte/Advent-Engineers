const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

async function debug() {
    const uri = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const jobId = 'JOB-2026-139';
    const order = await OrderModel.findOne({ jobId }).lean();
    console.log(`Order found: ${order ? order._id : 'null'}`);

    const transformers = await TransformerModel.find({ 
        $or: [
            { jobId: jobId },
            { orderId: order ? order._id : null }
        ]
    }).lean();
    
    console.log(`Found ${transformers.length} transformers`);
    
    transformers.forEach(t => {
        console.log(`ID: ${t.uniqueId}`);
        console.log(`  Current Stage: ${t.currentStage}`);
        console.log(`  Core Status: ${t.testHistory.core_test?.status}`);
        console.log(`  Secondary Status: ${t.testHistory.secondary_test?.status}`);
        console.log(`  Primary Status: ${t.testHistory.primary_test?.status}`);
        console.log(`  Final Status: ${t.testHistory.final_test?.status}`);
        console.log(`  Heating Record length: ${t.processHistory?.heatingRecord?.length || 0}`);
    });

    process.exit(0);
}

debug();

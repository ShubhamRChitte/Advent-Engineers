const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');
const { TransformerModel } = require('./models/TransformerModel');

async function debugRaw() {
    try {
        const uri = 'mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster';
        await mongoose.connect(uri);

        console.log("--- DEBUGGING RAW TRANSFORMERS ---");
        const transformers = await TransformerModel.find({}).populate('orderId').limit(10).lean();
        transformers.forEach(t => {
            console.log(`Unit: ${t.uniqueId}, Stage: ${t.currentStage}, Type: ${t.orderId?.transformerType || 'N/A'}`);
        });

        const job145Trans = await TransformerModel.find({ jobId: 'JOB-2026-145' }).populate('orderId').lean();
        console.log(`--- JOB 145 Units: ${job145Trans.length} ---`);
        job145Trans.forEach(t => {
            console.log(`Unit: ${t.uniqueId}, Stage: ${t.currentStage}, PT Status: ${t.testHistory?.primary_test?.status}, Heating Status: ${t.processHistory?.heatingRecord?.[0]?.status}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}

debugRaw();

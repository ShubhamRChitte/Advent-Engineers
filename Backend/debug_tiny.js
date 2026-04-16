const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');

async function debug() {
    const uri = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";
    await mongoose.connect(uri);
    const ts = await TransformerModel.find({ jobId: 'JOB-2026-139' }).lean();
    ts.forEach(t => {
        console.log(`U: ${t.uniqueId}, S: ${t.currentStage}, P: ${t.testHistory.primary_test?.status}`);
    });
    process.exit(0);
}
debug();

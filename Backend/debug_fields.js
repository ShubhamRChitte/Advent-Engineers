const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');

async function debugFields() {
    try {
        const uri = 'mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster';
        await mongoose.connect(uri);

        const t = await TransformerModel.findOne({ jobId: 'JOB-2026-145' }).lean();
        console.log("--- TRANSFORMER FIELDS ---");
        if (t) {
            console.log(JSON.stringify(t, null, 2));
        } else {
            console.log("No transformer found for job 145");
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}

debugFields();

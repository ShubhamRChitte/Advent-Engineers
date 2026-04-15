require('dotenv').config();
const { MongoClient } = require('mongodb');

async function debugExact() {
    try {
        const client = new MongoClient(process.env.MONGO_URL);
        await client.connect();
        const db = client.db();
        
        const trans = await db.collection('transformers').findOne({ jobId: "JOB-2026-137" });
        if (!trans) return console.log("Trans not found");
        
        const status = trans.testHistory?.primary_test?.status;
        console.log(`STATUS_VALUE: [${status}]`);
        console.log(`STATUS_TYPE: [${typeof status}]`);
        console.log(`JOBID_VALUE: [${trans.jobId}]`);
        
        await client.close();
    } catch (err) {
        console.error(err);
    }
}
debugExact();

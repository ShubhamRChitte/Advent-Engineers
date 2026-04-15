require('dotenv').config();
const { MongoClient } = require('mongodb');

async function debugStatusRaw() {
    try {
        const client = new MongoClient(process.env.MONGO_URL);
        await client.connect();
        const db = client.db();
        
        const trans = await db.collection('transformers').findOne({ jobId: "JOB-2026-137" });
        if (!trans) return console.log("Trans not found");
        
        console.log(`TR: ${trans.uniqueId}`);
        console.log(`- orderId: ${trans.orderId}`);
        console.log(`- jobId: ${trans.jobId}`);
        console.log(`- testHistory keys: ${Object.keys(trans.testHistory || {})}`);
        console.log(`- primary_test status: ${trans.testHistory?.primary_test?.status}`);
        
        await client.close();
    } catch (err) {
        console.error(err);
    }
}
debugStatusRaw();

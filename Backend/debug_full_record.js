require('dotenv').config();
const { MongoClient } = require('mongodb');

async function debugFullRecord() {
    try {
        const client = new MongoClient(process.env.MONGO_URL);
        await client.connect();
        const db = client.db();
        
        const trans = await db.collection('transformers').findOne({ jobId: "JOB-2026-137" });
        if (!trans) return console.log("Trans not found");
        
        console.log(`TR: ${trans.uniqueId}`);
        console.log(`- processHistory keys: ${Object.keys(trans.processHistory || {})}`);
        console.log(`- heatingRecord entries: ${trans.processHistory?.heatingRecord?.length || 0}`);
        
        if (trans.processHistory?.heatingRecord && trans.processHistory.heatingRecord.length > 0) {
            console.log("FIRST RECORD DATA:");
            console.log(JSON.stringify(trans.processHistory.heatingRecord[0], null, 2));
        }
        
        await client.close();
    } catch (err) {
        console.error(err);
    }
}
debugFullRecord();

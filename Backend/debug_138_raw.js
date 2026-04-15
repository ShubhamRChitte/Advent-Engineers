require('dotenv').config();
const { MongoClient } = require('mongodb');

async function debug138Raw() {
    try {
        const client = new MongoClient(process.env.MONGO_URL);
        await client.connect();
        const db = client.db();
        
        const order = await db.collection('orders').findOne({ jobId: "JOB-2026-138" });
        console.log(`Order 138 _id: ${order?._id}`);
        
        const trans = await db.collection('transformers').findOne({ jobId: "JOB-2026-138" });
        console.log(`Transformer orderId: ${trans?.orderId}`);

        await client.close();
    } catch (err) {
        console.error(err);
    }
}
debug138Raw();

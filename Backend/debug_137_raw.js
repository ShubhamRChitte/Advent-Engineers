require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function debug137Raw() {
    try {
        const client = new MongoClient(process.env.MONGO_URL);
        await client.connect();
        const db = client.db(); // Uses the DB from URL
        
        const orders = db.collection('orders');
        const transformers = db.collection('transformers');
        
        const order = await orders.findOne({ jobId: "JOB-2026-137" });
        if (!order) return console.log("Order 137 not found");
        console.log(`Order 137 _id: ${order._id}`);
        
        const transList = await transformers.find({ jobId: "JOB-2026-137" }).toArray();
        console.log(`Transformers found for Job 137: ${transList.length}`);
        
        transList.forEach(t => {
            console.log(`- TR: ${t.uniqueId} | raw orderId: ${t.orderId} | type: ${typeof t.orderId}`);
        });

        await client.close();
    } catch (err) {
        console.error(err);
    }
}
debug137Raw();

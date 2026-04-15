const mongoose = require('mongoose');
require('dotenv').config();

async function checkJob144() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const order = await db.collection('orders').findOne({ jobId: "JOB-2026-144" });
    if (!order) {
        console.log("Order not found");
        return;
    }
    console.log("Order 144:", JSON.stringify({
        _id: order._id,
        jobId: order.jobId,
        currentStage: order.currentStage,
        completionStages: order.completionStages
    }, null, 2));

    const transformers = await db.collection('transformers').find({ 
        $or: [ { orderId: order._id }, { jobId: order.jobId } ]
    }).toArray();

    console.log(`Found ${transformers.length} transformers`);
    transformers.forEach(t => {
        console.log(`Unit ${t.uniqueId}: stage=${t.currentStage}, primaryStatus=${t.testHistory?.primary_test?.status}`);
    });

    mongoose.disconnect();
}

checkJob144();

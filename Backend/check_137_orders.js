require('dotenv').config();
const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');

async function check137() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const orders = await OrderModel.find({ jobId: "JOB-2026-137" }).lean();
        console.log(`Orders found for JOB-2026-137: ${orders.length}`);
        orders.forEach(o => {
            console.log(`- Order: ${o._id} | Client: ${o.clientName} | Created: ${o.createdAt}`);
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
check137();

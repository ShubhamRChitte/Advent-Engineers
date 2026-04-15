require('dotenv').config();
const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');

async function checkDuplicates() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const orders = await OrderModel.find({ jobId: /138/i });
        console.log(`Orders found for /138/: ${orders.length}`);
        orders.forEach(o => {
            console.log(`Order: ${o.jobId} | ID: ${o._id} | CreatedAt: ${o.createdAt}`);
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
checkDuplicates();

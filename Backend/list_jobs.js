const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');

async function listJobs() {
    try {
        await mongoose.connect('mongodb://localhost:27017/advent_engineers');
        const orders = await OrderModel.find({}).select('jobId').limit(20);
        console.log("Job IDs:", orders.map(o => o.jobId));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
listJobs();

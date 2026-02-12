const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { OrderModel } = require('./models/OrderModel');

dotenv.config({ path: path.join(__dirname, '.env') });

const verifyRatio = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to DB");

        // Find the latest order or specific job
        const order = await OrderModel.findOne().sort({ createdAt: -1 });

        if (!order) {
            console.log("No order found");
        } else {
            console.log(`Order: ${order.jobId}`);
            console.log(`Ratio:`, order.ratio);
            console.log(`Full Docs:`, JSON.stringify(order.ratio));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

verifyRatio();

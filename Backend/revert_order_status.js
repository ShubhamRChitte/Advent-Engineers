const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const { OrderModel } = require('./models/OrderModel');

const runRevert = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to DB");

        const jobId = "JOB-2026-031";

        // Find Order
        const order = await OrderModel.findOne({ jobId: jobId });
        if (!order) {
            console.log("Order not found!");
            return;
        }

        console.log(`Current Status: ${order.status}, Stage: ${order.currentStage}`);

        // Revert to In Progress
        const res = await OrderModel.updateOne(
            { _id: order._id },
            {
                $set: {
                    status: "Core Testing In Progress",
                    currentStage: "core",
                    "completionStages.core": false // Optional: Mark core as not complete
                }
            }
        );

        console.log("Update Result:", res);
        console.log(`Order ${jobId} reverted to Core Testing In Progress.`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
};

runRevert();

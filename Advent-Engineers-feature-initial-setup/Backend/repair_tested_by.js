const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const { OrderModel } = require('./models/OrderModel');
const { MeteringCoreTestModel } = require('./models/MeteringCoreTestModel');
const { ProtectionCoreTestModel } = require('./models/ProtectionCoreTestModel');

const runRepair = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to DB");

        const targetJobId = "JOB-2026-033";
        const targetUser = "Pranav Godse";

        const order = await OrderModel.findOne({ jobId: targetJobId });
        if (!order) {
            console.log("Order not found!");
            return;
        }
        console.log(`Order Found: ${order._id}`);

        // Update Metering Tests - FORCE UPDATE ALL for this Order
        const resM = await MeteringCoreTestModel.updateMany(
            { orderId: order._id },
            { $set: { testedBy: targetUser } }
        );
        console.log(`Updated Metering Tests: ${resM.modifiedCount}, Matched: ${resM.matchedCount}`);

        // Update Protection Tests - FORCE UPDATE ALL for this Order
        const resP = await ProtectionCoreTestModel.updateMany(
            { orderId: order._id },
            { $set: { testedBy: targetUser } }
        );
        console.log(`Updated Protection Tests: ${resP.modifiedCount}, Matched: ${resP.matchedCount}`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
};

runRepair();

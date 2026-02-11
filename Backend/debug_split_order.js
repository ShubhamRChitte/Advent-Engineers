const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const { OrderModel } = require('./models/OrderModel');
const { MeteringCoreTestModel } = require('./models/MeteringCoreTestModel');
const { ProtectionCoreTestModel } = require('./models/ProtectionCoreTestModel');

const runDebug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to DB");

        // 1. Find the split order
        // Look for JOB-2026-031
        const order = await OrderModel.findOne({ jobId: "JOB-2026-031" });
        if (!order) {
            console.log("Order JOB-2026-031 not found!");
            return;
        }
        console.log(`Order Found: ${order.jobId}, Qty: ${order.quantity}, ID: ${order._id}`);
        console.log("Assigned Unit IDs:", JSON.stringify(order.assignedUnitIds));

        // 2. Fetch Metering Tests for this order
        const mTests = await MeteringCoreTestModel.find({ orderId: order._id });
        console.log(`\nFound ${mTests.length} Metering Documents.`);
        mTests.forEach((doc, i) => {
            console.log(`[Doc ${i}] testedBy: ${doc.testedBy}`);
            console.log(`        Readings Count: ${doc.readings ? doc.readings.length : 0}`);
            if (doc.readings && doc.readings.length > 0) {
                console.log(`        First Reading ID: ${doc.readings[0].internalCoreNo}`);
                console.log(`        Last Reading ID: ${doc.readings[doc.readings.length - 1].internalCoreNo}`);
            }
        });

        // 3. Fetch Protection Tests
        const pTests = await ProtectionCoreTestModel.find({ orderId: order._id });
        console.log(`\nFound ${pTests.length} Protection Documents.`);
        pTests.forEach((doc, i) => {
            console.log(`[Doc ${i}] Type: ${doc.coreType}, testedBy: ${doc.testedBy}`);
            console.log(`        Readings Count: ${doc.readings ? doc.readings.length : 0}`);
        });

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
};

runDebug();

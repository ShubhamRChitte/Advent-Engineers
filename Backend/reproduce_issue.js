const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');
const { TransformerModel } = require('./models/TransformerModel');
const { HeatingRecordModel } = require('./models/HeatingRecordModel');

async function verifyTransition() {
    try {
        // Connect to MongoDB (adjust URI if needed, usually in .env)
        await mongoose.connect('mongodb://localhost:27017/advent_engineers'); // Default local URI
        console.log("Connected to DB");

        const testOrderId = "MOCK_ORDER_123";
        const testJobId = "JOB-2026-999";

        // 1. Setup Mock Data
        console.log("Setting up mock data...");
        await OrderModel.deleteMany({ jobId: testJobId });
        await TransformerModel.deleteMany({ jobId: testJobId });
        await HeatingRecordModel.deleteMany({ orderId: testOrderId });

        const order = await OrderModel.create({
            jobId: testJobId,
            clientName: "Test Client",
            clientContactNo: "1234567890",
            transformerName: "Test CT",
            transformerType: "CT",
            quantity: 1,
            ratedSecondaryCurrent: 1,
            isStandard: "Yes",
            deadline: new Date(),
            currentStage: "heating",
            status: "In Progress",
            completionStages: {
                core: true,
                secondary: true,
                primary: true,
                heating: false
            }
        });

        const transformer = await TransformerModel.create({
            uniqueId: `TR-${testJobId}-001`,
            orderId: order._id,
            jobId: testJobId,
            currentStage: "heating"
        });

        const heatingRecord = await HeatingRecordModel.create({
            orderId: order._id.toString(),
            transformerType: "11KV_CT",
            status: "Pending",
            blocks: [{ serialNumber: transformer.uniqueId }]
        });

        console.log("Initial State:");
        console.log("- Order Stage:", order.currentStage);
        console.log("- Transformer Stage:", transformer.currentStage);
        console.log("- Heating Record Status:", heatingRecord.status);

        // 2. Simulate Approval Logic (Current broken state)
        console.log("\nSimulating CURRENT approval logic...");
        const recordToApprove = await HeatingRecordModel.findOne({ orderId: order._id.toString() });
        recordToApprove.status = 'Completed';
        await recordToApprove.save();

        const updatedOrder = await OrderModel.findById(order._id);
        const updatedTransformer = await TransformerModel.findById(transformer._id);

        console.log("After Current Approval Logic:");
        console.log("- Order Stage:", updatedOrder.currentStage, "(Should be 'final'?)");
        console.log("- Transformer Stage:", updatedTransformer.currentStage, "(Should be 'final'?)");
        console.log("- Heating Record Status:", recordToApprove.status);

        if (updatedOrder.currentStage === "heating") {
            console.log("\n[CONFIRMED] Order DID NOT transition to 'final'.");
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verifyTransition();

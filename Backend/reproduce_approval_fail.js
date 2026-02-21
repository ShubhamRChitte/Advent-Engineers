const mongoose = require('mongoose');
const { Schema } = mongoose;

const MONGO_URL = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";

const OrderSchema = new Schema({
    jobId: String
});
// Simulate Transformer where orderId CAN be a string (invalid regarding ref but possible in raw data)
const TransformerSchema = new Schema({
    uniqueId: String,
    orderId: { type: Schema.Types.Mixed }, // Loosened for repro to allow string storage if schema validation isn't strict or legacy data
    jobId: String,
    currentStage: String,
    testHistory: {
        secondary_test: { status: String, timestamp: Date, tester: String },
        primary_test: { status: String, timestamp: Date, tester: String }
    }
});

const OrderModel = mongoose.model('Order_Repro_Approve', OrderSchema);
const TransformerModel = mongoose.model('Transformer_Repro_Approve', TransformerSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB");

        // 1. Create Order
        const order = new OrderModel({ jobId: "JOB-FAIL-001" });
        await order.save();
        console.log("Order created:", order._id);

        // 2. Create Transformer with String orderId (simulating the bug source)
        // Note: If schema requires ObjectId, this save might fail.
        // But if previous bugs allowed it, or if we force it, let's see.
        // If strict mode is on for type, we might need to bypass it or see how data got there.
        // Assuming data IS there as string.
        const transformer = new TransformerModel({
            uniqueId: "TR-FAIL-001",
            orderId: "JOB-FAIL-001", // <--- THE PROBLEM
            currentStage: "primary"
        });
        await transformer.save();
        console.log("Transformer created with String orderId");

        // 3. Simulate Route Logic
        console.log("Simulating Approval Route...");
        try {
            // The offending line:
            const fetchedOrder = await OrderModel.findById(transformer.orderId);
            console.log("Order fetched successfully (Unexpected):", fetchedOrder);
        } catch (err) {
            console.log("Caught expected error:");
            console.log(err.name);
            console.log(err.message);
        }

        await OrderModel.deleteMany({});
        await TransformerModel.deleteMany({});
        await mongoose.disconnect();
    } catch (err) {
        console.error("Setup error:", err);
    }
}

run();

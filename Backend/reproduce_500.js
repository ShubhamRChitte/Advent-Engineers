const mongoose = require('mongoose');
const { Schema } = mongoose;

const MONGO_URL = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";

const OrderSchema = new Schema({
    jobId: String
});
const TransformerSchema = new Schema({
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    jobId: String
});

const OrderModel = mongoose.model('Order_Repro', OrderSchema);
const TransformerModel = mongoose.model('Transformer_Repro', TransformerSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB");

        // Create a dummy order
        const order = new OrderModel({ jobId: "JOB-TEST-001" });
        await order.save();
        console.log("Order created:", order._id, order.jobId);

        // attempts to query
        console.log("Attempting query that is suspected to fail...");
        try {
            const transformers = await TransformerModel.find({
                $or: [
                    { orderId: order._id },
                    { orderId: order._id.toString() },
                    { orderId: order.jobId } // "JOB-TEST-001" - should fail casting to ObjectId
                ]
            });
            console.log("Query success (unexpected):", transformers);
        } catch (err) {
            console.log("Caught expected error:");
            console.log(err.name);
            console.log(err.message);
        }

        await OrderModel.deleteMany({});
        await mongoose.disconnect();
    } catch (err) {
        console.error("Setup error:", err);
    }
}

run();

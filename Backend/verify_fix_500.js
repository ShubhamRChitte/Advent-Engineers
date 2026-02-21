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

const OrderModel = mongoose.model('Order_Verify', OrderSchema);
const TransformerModel = mongoose.model('Transformer_Verify', TransformerSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB");

        // Create a dummy order
        const order = new OrderModel({ jobId: "JOB-VERIFY-001" });
        await order.save();
        console.log("Order created:", order._id, order.jobId);

        // attempts to query with FIX
        console.log("Attempting query with FIX...");
        try {
            const transformers = await TransformerModel.find({
                $or: [
                    { orderId: order._id },
                    { orderId: order._id.toString() },
                    { jobId: order.jobId } // <--- FIX: Querying jobId field
                ]
            });
            console.log("Query success! Found:", transformers.length);
        } catch (err) {
            console.log("Caught unexpected error:");
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

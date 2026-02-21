const mongoose = require('mongoose');
const { Schema } = mongoose;

const MONGO_URL = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";

const OrderSchema = new Schema({}, { strict: false });
const TransformerSchema = new Schema({}, { strict: false });

const OrderModel = mongoose.model('Order_Repro_Route', OrderSchema, 'orders');
const TransformerModel = mongoose.model('Transformer_Repro_Route', TransformerSchema, 'transformers');

async function run() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB");

        const targetJobId = "JOB-2026-067";

        // 1. Get the real _id for this job to simulate frontend request
        const realOrder = await OrderModel.findOne({ jobId: targetJobId });
        if (!realOrder) {
            console.log("CRITICAL: Order not found!");
            return;
        }
        const orderIdParam = realOrder._id.toString();
        console.log(`Simulating request with params: orderId = ${orderIdParam}`);

        // --- ROUTE LOGIC SIMULATION (from taskRoutes.js) ---
        let order;

        if (mongoose.Types.ObjectId.isValid(orderIdParam)) {
            console.log("Param is valid ObjectId. Calling findById...");
            order = await OrderModel.findById(orderIdParam);
        }

        if (!order) {
            console.log("Order not found by ID. Trying lookup by string...");
            order = await OrderModel.findOne({ $or: [{ jobId: orderIdParam }, { orderId: orderIdParam }] });
        }

        if (!order) {
            console.log("Order still not found.");
        } else {
            console.log(`Order Found. ID: ${order._id}, JobID: '${order.jobId}'`);

            const query = {
                $or: [
                    { orderId: order._id },
                    { orderId: order._id.toString() },
                    { jobId: order.jobId }
                ]
            };
            console.log("Running Transformer Query:", JSON.stringify(query));

            const transformers = await TransformerModel.find(query);
            console.log(`Transformers Found: ${transformers.length}`);
        }
        // ---------------------------------------------------

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
}

run();

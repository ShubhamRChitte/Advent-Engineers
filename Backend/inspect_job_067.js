const mongoose = require('mongoose');
const { Schema } = mongoose;

const MONGO_URL = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";

const OrderSchema = new Schema({
    jobId: String,
    _id: Schema.Types.ObjectId
}, { strict: false });

const TransformerSchema = new Schema({
    uniqueId: String,
    orderId: Schema.Types.Mixed,
    jobId: String
}, { strict: false });

const OrderModel = mongoose.model('Order_Inspect_067_Concise', OrderSchema, 'orders');
const TransformerModel = mongoose.model('Transformer_Inspect_067_Concise', TransformerSchema, 'transformers');

async function run() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB");

        const jobId = "JOB-2026-067";
        console.log(`\nInspecting Job: ${jobId}`);

        const order = await OrderModel.findOne({ jobId });
        if (!order) {
            console.log("Order NOT found!");
        } else {
            console.log(`Order Found: ID=${order._id}, JobID=${order.jobId}`);

            const tfByObjectId = await TransformerModel.countDocuments({ orderId: order._id });
            console.log(`Transformers linked by ObjectId: ${tfByObjectId}`);

            const tfByStringId = await TransformerModel.countDocuments({ orderId: order._id.toString() });
            console.log(`Transformers linked by String ID: ${tfByStringId}`);

            const tfByJobId = await TransformerModel.countDocuments({ jobId: jobId });
            console.log(`Transformers linked by JobId field: ${tfByJobId}`);

            const tfByOrderIdString = await TransformerModel.countDocuments({ orderId: jobId });
            console.log(`Transformers linked by orderId="${jobId}": ${tfByOrderIdString}`);

            if (tfByJobId > 0) {
                const sample = await TransformerModel.findOne({ jobId: jobId }).select('uniqueId orderId jobId').lean();
                console.log("\nSample Transformer (by JobId):", sample);
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
}

run();

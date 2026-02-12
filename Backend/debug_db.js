const mongoose = require('mongoose');
// require("dotenv").config();

// Define minimal schemas to read data
const TransformerSchema = new mongoose.Schema({}, { strict: false });
const TransformerModel = mongoose.model('Transformer', TransformerSchema);

const OrderSchema = new mongoose.Schema({}, { strict: false });
const OrderModel = mongoose.model('Order', OrderSchema);

const UserSchema = new mongoose.Schema({}, { strict: false });
const UserModel = mongoose.model('User', UserSchema);

const uri = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";

async function run() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to DB");

        // 1. Find User Rahul
        const user = await UserModel.findOne({ fullName: new RegExp("Rahul", "i") });
        console.log("\n--- User: Rahul ---");
        console.log(user ? `${user.fullName} (${user.employeeId})` : "Not Found");

        // 2. Find Order JOB-2026-010
        const jobID = "JOB-2026-010"; // Based on screenshot
        const order = await OrderModel.findOne({ jobId: new RegExp("2026-010", "i") });

        if (!order) {
            console.log(`\nOrder ${jobID} not found.`);
        } else {
            console.log(`\n--- Order: ${order.jobId} ---`);
            console.log("ID:", order._id);
            console.log("Quantity:", order.quantity);

            // 3. Find Transformers for this order
            const transformers = await TransformerModel.find({ orderId: order._id });
            console.log(`\nFound ${transformers.length} transformers:`);
            transformers.forEach(t => {
                console.log(`- UniqueID: "${t.uniqueId}" | Assigned Core Tester: "${t.assignments?.core_tester}"`);
            });
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();

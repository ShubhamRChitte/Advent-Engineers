const mongoose = require('mongoose');
const { CounterModel } = require('./models/CounterModel');
const { OrderModel } = require('./models/OrderModel');

// Hardcoded URI to match debug_db.js success
const uri = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";

async function fixCounter() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(uri);
        console.log("Connected.");

        // 1. Find all orders to determine the current max Job ID
        const orders = await OrderModel.find({}).select('jobId');

        let maxSeq = 0;
        const currentYear = new Date().getFullYear();
        const yearPrefix = `JOB-${currentYear}-`; // "JOB-2026-"

        orders.forEach(o => {
            if (o.jobId && o.jobId.startsWith(yearPrefix)) {
                // "JOB-2026-034" -> 34
                const parts = o.jobId.split('-');
                const num = parseInt(parts[2]);
                if (!isNaN(num) && num > maxSeq) {
                    maxSeq = num;
                }
            }
        });

        console.log(`Highest existing Job ID suffix for ${currentYear} is: ${maxSeq}`);

        // 2. Update Counter
        // The getNextSequenceValue function increments first ($inc), then returns.
        // So if we set it to 'maxSeq', the next call will return 'maxSeq + 1'.
        const result = await CounterModel.findOneAndUpdate(
            { id: "job_sequence" },
            { $set: { seq: maxSeq } },
            { new: true, upsert: true }
        );

        console.log("Updated 'job_sequence' counter to:", result.seq);
        console.log("The next created order will be:", `JOB-${currentYear}-${String(maxSeq + 1).padStart(3, '0')}`);

    } catch (err) {
        console.error("Error fixing counter:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

fixCounter();

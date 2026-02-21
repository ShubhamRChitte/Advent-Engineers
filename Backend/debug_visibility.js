const mongoose = require('mongoose');
const fs = require('fs');

// Log function
function log(msg) {
    console.log(msg);
    fs.appendFileSync('debug_visibility.txt', msg + '\n');
}
fs.writeFileSync('debug_visibility.txt', '');

const uri = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";

// Mock User (Rahul Sharma)
const mockUser = {
    name: "Rahul Sharma",
    department: "Core Test"
};

const STAGE_KEY = "core";

log("Starting Debug Script for Visibility...");

async function run() {
    try {
        await mongoose.connect(uri);
        log("Connected to DB");

        const { OrderModel } = require('./models/OrderModel');
        const { TransformerModel } = require('./models/TransformerModel');

        // 1. Find orders assigned to Rahul
        const orders = await OrderModel.find({
            "assignments.core_tester": mockUser.name
        }).lean();

        log(`Found ${orders.length} orders for ${mockUser.name}`);

        for (const order of orders) {
            log(`\nChecking Order: ${order.jobId}`);

            // 2. Find Assigned Units (Granular)
            const transformers = await TransformerModel.find({
                orderId: order._id
            }).lean();

            // Filter for Rahul's units
            const myUnits = transformers.filter(t =>
                t.assignments?.core_tester === mockUser.name
            );

            log(`Total Units: ${transformers.length}`);
            log(`My Assigned Units: ${myUnits.length}`);

            if (myUnits.length === 0) {
                log("  -> No explicit granular assignments found for this user.");
                continue;
            }

            // 3. Check Stage of My Units
            let activeCount = 0;
            myUnits.forEach(t => {
                log(`  Unit ${t.uniqueId}: Stage=${t.currentStage}`);
                if (t.currentStage === STAGE_KEY) activeCount++;
            });

            log(`  -> Active Units in '${STAGE_KEY}': ${activeCount}`);

            if (activeCount === 0) {
                log("  => ISSUE: This order should be HIDDEN from Active list because all my units are done.");
            } else {
                log("  => CORRECT: This order should be VISIBLE.");
            }
        }

    } catch (err) {
        log("Error: " + err);
    } finally {
        mongoose.disconnect();
    }
}

run();

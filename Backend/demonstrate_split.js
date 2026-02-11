
const mongoose = require('mongoose');
require("dotenv").config();
const { OrderModel } = require('./models/OrderModel');
const { TransformerModel } = require('./models/TransformerModel');

const MONGO_URI = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/advent_db";

async function demonstrateSplit() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URI);

        const orderId = "6983458827d81a1baa36beff";

        // 1. Fetch the Order
        const order = await OrderModel.findById(orderId);
        if (!order) {
            console.log("Order not found!");
            return;
        }

        console.log("Current Assignments in Order:");
        order.assignments.forEach((a, i) => {
            if (a.stage === 'core') {
                console.log(`[${i}] ${a.testerName}: ${a.unitRange.from}-${a.unitRange.to}`);
            }
        });

        // 2. Remove the conflicting "1-50" assignment if it exists
        // We want to keep Rahul (1-25) and Pranav (26-50)
        // The one at index 2 (usually) is the "Rahul 1-50" one in the provided JSON

        const newAssignments = order.assignments.filter(a => {
            // Filter out the "duplicate" full-range assignment for Rahul in 'core' stage
            if (a.stage === 'core' && a.unitRange.from === 1 && a.unitRange.to === 50 && a.testerName === "Rahul Sharma") {
                // But wait, make sure we keep the split ones.
                // The splitting ones are usually "Rahul 1-25" and "Pranav 26-50".
                // So removing "Rahul 1-50" is safe.
                return false;
            }
            return true;
        });

        if (newAssignments.length !== order.assignments.length) {
            console.log("\nRemoving conflicting 'full range' assignment to demonstrate split...");
            order.assignments = newAssignments;
            await order.save();
            console.log("Order updated.");
        } else {
            console.log("\nNo conflicting assignment found (or already removed).");
        }

        // 3. Re-Apply Assignments to Transformers
        console.log("Re-applying assignments to individual units...");

        const unitAssignments = {};
        order.assignments.forEach(assign => {
            if (assign.unitRange && assign.unitRange.from && assign.unitRange.to) {
                for (let i = assign.unitRange.from; i <= assign.unitRange.to; i++) {
                    if (!unitAssignments[i]) unitAssignments[i] = {};
                    if (assign.stage === 'core') unitAssignments[i].core_tester = assign.testerName;
                    // ... others ignored for this demo
                }
            }
        });

        const bulkOps = [];
        for (let i = 1; i <= order.quantity; i++) {
            const uniqueId = `${order.jobId}/${i.toString().padStart(2, '0')}`;
            const specificAssignments = unitAssignments[i];

            // We want to update JUST the assignment
            if (specificAssignments) {
                bulkOps.push({
                    updateOne: {
                        filter: { uniqueId: uniqueId },
                        // We use $set to partial update, but we want to ensure core_tester is exactly what we say
                        update: { $set: { "assignments.core_tester": specificAssignments.core_tester } }
                    }
                });
            }
        }

        if (bulkOps.length > 0) {
            await TransformerModel.bulkWrite(bulkOps);
            console.log(`Updated ${bulkOps.length} transformers.`);
        }

        // 4. Verify Results
        const rahulCount = await TransformerModel.countDocuments({
            orderId: order._id,
            "assignments.core_tester": "Rahul Sharma"
        });
        const pranavCount = await TransformerModel.countDocuments({
            orderId: order._id,
            "assignments.core_tester": "Pranav Godse"
        });

        console.log("\n--- VERIFICATION RESULTS ---");
        console.log(`Rahul Sharma Assigned Units: ${rahulCount}`);
        console.log(`Pranav Godse Assigned Units: ${pranavCount}`);

        if (rahulCount === 25 && pranavCount === 25) {
            console.log("SUCCESS: Split logic confirmed!");
        } else {
            console.log("WARNING: Distribution not as expected.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

demonstrateSplit();

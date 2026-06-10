const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');
require("dotenv").config();

const uri = process.env.MONGO_URL;

async function migrate() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to DB");

        // 1. Find transformers without assignments field or with empty assignments
        // (Actually, just find ALL and update them to be safe, or filter by needing update)
        // Let's target the known problem order first to be fast, or all.
        // Found 'JOB-2026-007' is the one.

        const orders = await OrderModel.find({});
        console.log(`Found ${orders.length} orders. Processing substitutions...`);

        for (const order of orders) {
            if (!order.assignments || order.assignments.length === 0) continue;

            console.log(`Processing Order: ${order.jobId}`);

            // Get all transformers for this order
            const transformers = await TransformerModel.find({ orderId: order._id });

            // Build Unit map
            const unitAssignments = {};
            for (let i = 1; i <= order.quantity; i++) {
                unitAssignments[i] = {
                    core_tester: "",
                    secondary_tester: "",
                    primary_tester: "",
                    final_tester: ""
                };
            }

            // Fill from Order Assignments
            order.assignments.forEach(assign => {
                const { stage, testerName, unitRange } = assign;
                const from = parseInt(unitRange.from);
                const to = parseInt(unitRange.to) || order.quantity;

                for (let u = from; u <= to; u++) {
                    if (unitAssignments[u]) {
                        unitAssignments[u][`${stage}_tester`] = testerName;
                    }
                }
            });

            // Update Transformers
            for (const t of transformers) {
                // Parse unit number from UniqueID: TR-JOB-2026-007-001 -> 001
                const parts = t.uniqueId.split('-');
                const seqStr = parts[parts.length - 1]; // "001"
                const unitNo = parseInt(seqStr);

                if (unitAssignments[unitNo]) {
                    t.assignments = unitAssignments[unitNo];
                    await t.save();
                    console.log(`Updated Unit ${unitNo} (${t.uniqueId}) with assignments.`);
                }
            }
        }

        console.log("Migration Complete.");

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

migrate();

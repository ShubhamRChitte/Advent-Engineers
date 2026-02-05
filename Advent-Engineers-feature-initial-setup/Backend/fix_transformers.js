
const mongoose = require('mongoose');
require("dotenv").config(); // Try to load .env if available, though we might rely on hardcoded URI if it fails

const { OrderModel } = require('./models/OrderModel');
const { TransformerModel } = require('./models/TransformerModel');

// Hardcode URI as fallback to ensure it works immediately 
const MONGO_URI = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/advent_db";

async function fixTransformers() {
    try {
        console.log("Connecting to:", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");

        // 1. Find Orders that are approved but might be missing transformers
        // Specifically targeting the one the user is identified with or all approved ones
        const orders = await OrderModel.find({ isApproved: true });
        console.log(`Found ${orders.length} approved orders.`);

        for (const order of orders) {
            console.log(`\nProcessing Order: ${order.jobId} (ID: ${order._id})`);
            console.log(`Quantity: ${order.quantity}`);

            // Check if transformers already exist
            const existingCount = await TransformerModel.countDocuments({ orderId: order._id });
            console.log(`Existing Transformers: ${existingCount}`);

            if (existingCount < order.quantity) {
                console.log(`>> Generatiing missing transformers for ${order.jobId}...`);

                // Map assignments for faster lookup:  unitIndex -> { core_tester: '...', secondary_tester: '...' }
                const unitAssignments = {};

                if (order.assignments && Array.isArray(order.assignments)) {
                    order.assignments.forEach(assign => {
                        if (assign.unitRange && assign.unitRange.from && assign.unitRange.to) {
                            for (let i = assign.unitRange.from; i <= assign.unitRange.to; i++) {
                                if (!unitAssignments[i]) unitAssignments[i] = {};

                                // Map stage to field name
                                if (assign.stage === 'core') unitAssignments[i].core_tester = assign.testerName;
                                if (assign.stage === 'secondary') unitAssignments[i].secondary_tester = assign.testerName;
                                if (assign.stage === 'primary') unitAssignments[i].primary_tester = assign.testerName;
                                if (assign.stage === 'final') unitAssignments[i].final_tester = assign.testerName;
                            }
                        }
                    });
                }

                // Generate Transformers
                const bulkOps = [];
                for (let i = 1; i <= order.quantity; i++) {
                    const uniqueId = `${order.jobId}/${i.toString().padStart(2, '0')}`;

                    // Get assignments for this specific unit
                    const specificAssignments = unitAssignments[i] || {};

                    // Determine initial stage (default core, unless logic dictates otherwise)
                    // If order status implies completed, we might need to be smarter, but let's default to 'core' 
                    // or respect the order's currentStage if valid.

                    const tfDoc = {
                        orderId: order._id,
                        jobId: order.jobId,
                        uniqueId: uniqueId,
                        currentStage: order.currentStage || 'core',
                        assignments: specificAssignments,
                        testHistory: {
                            core_test: { status: 'Pending' },
                            secondary_test: { status: 'Pending' },
                            primary_test: { status: 'Pending' },
                            final_test: { status: 'Pending' }
                        }
                    };

                    // Upsert to be safe (Update if exists, Insert if not)
                    bulkOps.push({
                        updateOne: {
                            filter: { uniqueId: uniqueId },
                            update: { $set: tfDoc },
                            upsert: true
                        }
                    });
                }

                if (bulkOps.length > 0) {
                    await TransformerModel.bulkWrite(bulkOps);
                    console.log(`>> Upserted ${bulkOps.length} transformers.`);
                }
            } else {
                console.log("Transformers already exist. Checking assignments update...");
                // Even if they exist, we might want to PATCH assignments if they are missing
                // For now, let's assume if count matches, we are good, OR explicit overwrite requested.
                // Let's implement a "Force Update Assignments" logic briefly.

                const unitAssignments = {};
                if (order.assignments && Array.isArray(order.assignments)) {
                    order.assignments.forEach(assign => {
                        if (assign.unitRange) {
                            for (let i = assign.unitRange.from; i <= assign.unitRange.to; i++) {
                                if (!unitAssignments[i]) unitAssignments[i] = {};
                                if (assign.stage === 'core') unitAssignments[i].core_tester = assign.testerName;
                                if (assign.stage === 'secondary') unitAssignments[i].secondary_tester = assign.testerName;
                                if (assign.stage === 'primary') unitAssignments[i].primary_tester = assign.testerName;
                                if (assign.stage === 'final') unitAssignments[i].final_tester = assign.testerName;
                            }
                        }
                    });

                    const bulkOps = [];
                    for (let i = 1; i <= order.quantity; i++) {
                        const uniqueId = `${order.jobId}/${i.toString().padStart(2, '0')}`;
                        const specificAssignments = unitAssignments[i];
                        if (specificAssignments) {
                            bulkOps.push({
                                updateOne: {
                                    filter: { uniqueId: uniqueId },
                                    update: { $set: { assignments: specificAssignments } }
                                }
                            });
                        }
                    }
                    if (bulkOps.length > 0) {
                        await TransformerModel.bulkWrite(bulkOps);
                        console.log(`>> Refreshed assignments for ${bulkOps.length} transformers.`);
                    }
                }
            }

            // Fix Order Status if needed
            if (order.status === "Pending Approval") {
                order.status = "Core Testing In Progress"; // Or just 'In Progress'
                order.isApproved = true;
                await order.save();
                console.log(">> Updated Order Status to In Progress");
            }
        }

        console.log("\nDone!");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

fixTransformers();

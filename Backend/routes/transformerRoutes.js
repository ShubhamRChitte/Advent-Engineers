const express = require('express');
const router = express.Router();
const { TransformerModel } = require('../models/TransformerModel');
const { OrderModel } = require('../models/OrderModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// GET /api/transformers/order/:orderId
// Returns all transformers for a specific order with their Core Test Readings attached
router.get('/order/:orderId', isAuthenticated, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { MeteringCoreTestModel } = require('../models/MeteringCoreTestModel');
        const { ProtectionCoreTestModel } = require('../models/ProtectionCoreTestModel');

        // 1. Fetch Transformers
        const transformers = await TransformerModel.find({ orderId }).populate('orderId').lean();

        // 2. Fetch Core Test Data
        const meteringTests = await MeteringCoreTestModel.find({ orderId }).lean();
        const protectionTests = await ProtectionCoreTestModel.find({ orderId }).lean();

        // 3. Attach Readings to Transformers
        const transformersWithReadings = transformers.map(transformer => {
            // Find matching test data based on internalCoreNo matching uniqueId
            // Note: uniqueId format is typically TR-JOB-xxxx-yyy, internalCoreNo in tests might vary
            // We'll try exact match first, then check if uniqueId contains internalCoreNo

            let coreTestReadings = null;
            let testType = null;

            // Check Metering
            const meteringMatch = meteringTests.find(test =>
                test.readings.some(r => r.internalCoreNo === transformer.uniqueId || transformer.uniqueId.includes(r.internalCoreNo))
            );

            if (meteringMatch) {
                // Extract the specific reading for this transformer
                const reading = meteringMatch.readings.find(r => r.internalCoreNo === transformer.uniqueId || transformer.uniqueId.includes(r.internalCoreNo));
                if (reading) {
                    coreTestReadings = {
                        type: 'Metering',
                        ...reading,
                        testLimits: meteringMatch.testLimits // Include limits for context
                    };
                    testType = 'Metering';
                }
            }

            // Check Protection (if not found in Metering)
            if (!coreTestReadings) {
                const protectionMatch = protectionTests.find(test =>
                    test.readings.some(r => r.internalCoreNo === transformer.uniqueId || transformer.uniqueId.includes(r.internalCoreNo))
                );

                if (protectionMatch) {
                    const reading = protectionMatch.readings.find(r => r.internalCoreNo === transformer.uniqueId || transformer.uniqueId.includes(r.internalCoreNo));
                    if (reading) {
                        coreTestReadings = {
                            type: 'Protection',
                            ...reading,
                            testSpecification: protectionMatch.testSpecification // Include specs
                        };
                        testType = 'Protection';
                    }
                }
            }

            return {
                ...transformer,
                coreTestReadings,
                coreTestType: testType
            };
        });

        res.json(transformersWithReadings);
    } catch (error) {
        console.error("Error fetching transformers:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/transformers/:uniqueId/approve-stage
// Moves transformer to next stage and checks if the Tester's assignment is complete
router.put('/:uniqueId/approve-stage', isAuthenticated, async (req, res) => {
    try {
        const { uniqueId } = req.params;
        const { stage, nextStage } = req.body; // stage = 'secondary', nextStage = 'primary'
        const user = req.user;
        const testerName = user.name || user.fullName;

        // 1. Find Transformer
        const transformer = await TransformerModel.findOne({ uniqueId });
        if (!transformer) {
            return res.status(404).json({ success: false, message: "Transformer not found" });
        }

        // 2. Update Transformer Stage & Timestamp
        transformer.currentStage = nextStage; // e.g., 'primary'

        // Update History Timestamp for the completed stage
        if (stage === 'secondary') {
            if (!transformer.testHistory.secondary_test) {
                transformer.testHistory.secondary_test = {};
            }
            transformer.testHistory.secondary_test.status = 'Completed';
            transformer.testHistory.secondary_test.timestamp = new Date();
            transformer.testHistory.secondary_test.tester = testerName;
        } else if (stage === 'primary') {
            if (!transformer.testHistory.primary_test) {
                transformer.testHistory.primary_test = {};
            }
            transformer.testHistory.primary_test.status = 'Completed';
            transformer.testHistory.primary_test.timestamp = new Date();
            transformer.testHistory.primary_test.tester = testerName;
        } else if (stage === 'final') {
            if (!transformer.testHistory.final_test) {
                transformer.testHistory.final_test = {};
            }
            transformer.testHistory.final_test.status = 'Completed';
            transformer.testHistory.final_test.timestamp = new Date();
            transformer.testHistory.final_test.tester = testerName;
        }

        await transformer.save();

        // 3. Check Order Assignment Completion
        // We need to check if ALL units assigned to this tester for this stage are now completed.

        // FIX: Handle potential string orderId (CastError)
        let order = null;
        const mongoose = require('mongoose');

        if (mongoose.Types.ObjectId.isValid(transformer.orderId)) {
            order = await OrderModel.findById(transformer.orderId);
        }

        if (!order) {
            // Fallback: If orderId is a string (e.g. "JOB-2026-...") or findById failed
            // Try to find by jobId
            order = await OrderModel.findOne({ jobId: transformer.orderId });
        }

        if (order && order.assignments) {

            // Find the specific assignment entry for this tester and stage
            const assignment = order.assignments.find(a =>
                (a.testerName === testerName || a.testerName === user.fullName) &&
                a.stage === stage
            );

            if (assignment) {
                // Verify if ALL transformers in this range are now done
                // "Done" means their currentStage is NOT 'core' or 'secondary' (i.e., they moved to primary/final/completed)
                // OR explicitly check if they are NOT in the current stage anymore.

                const { from, to } = assignment.unitRange;
                const jobId = order.jobId;

                // Construct IDs for the range
                const idsInRange = [];
                for (let i = from; i <= to; i++) {
                    idsInRange.push(`TR-${jobId}-${String(i).padStart(3, '0')}`);
                }

                // Count how many are STILL in the current stage (e.g., 'secondary')
                // If 0, then the batch is complete.
                const pendingCount = await TransformerModel.countDocuments({
                    uniqueId: { $in: idsInRange },
                    currentStage: stage // e.g. 'secondary'
                });

                if (pendingCount === 0) {
                    // Mark Assignment as Completed
                    assignment.status = "Completed";

                    // Optional: Update global Order completion flags if needed
                    // if (stage === 'secondary') order.completionStages.secondary = true; 
                    // (But granular logic usually keeps completionStages for overall)

                    await order.save();
                    console.log(`Assignment for ${testerName} on ${jobId} (${stage}) marked as Completed.`);
                }
            }
        }

        res.json({ success: true, message: "Transformer approved and stage updated." });

    } catch (error) {
        console.error("Error approving stage:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

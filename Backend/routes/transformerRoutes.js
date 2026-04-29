const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { TransformerModel } = require('../models/TransformerModel');
const { OrderModel } = require('../models/OrderModel');
const { MeteringCoreTestModel } = require('../models/MeteringCoreTestModel');
const { ProtectionCoreTestModel } = require('../models/ProtectionCoreTestModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// GET /api/transformers/order/:orderId
// Returns all transformers for a specific order with their Core Test Readings attached
router.get('/order/:orderId', isAuthenticated, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { MeteringCoreTestModel } = require('../models/MeteringCoreTestModel');
        const { ProtectionCoreTestModel } = require('../models/ProtectionCoreTestModel');
        
        const mongoose = require('mongoose');
        let queryOrderId = orderId;
        if (mongoose.Types.ObjectId.isValid(orderId)) {
            queryOrderId = new mongoose.Types.ObjectId(orderId);
        }

        // Fetch Order to get jobId for triple-match
        const order = await OrderModel.findOne({ 
            $or: [{ _id: queryOrderId }, { jobId: orderId }] 
        }).lean();
        const jobNo = order ? order.jobId : (orderId.startsWith('JOB-') ? orderId : null);

        const tripleQuery = {
            $or: [
                { orderId: queryOrderId },
                { orderId: orderId.toString() },
                ...(jobNo ? [{ jobId: jobNo }] : [])
            ]
        };

        // 1. Fetch Transformers
        const transformers = await TransformerModel.find(tripleQuery).populate('orderId').sort({ internalCoreNo: 1 }).lean();

        // 2. Fetch Core Test Data
        const meteringTests = await MeteringCoreTestModel.find(tripleQuery).lean();
        const protectionTests = await ProtectionCoreTestModel.find(tripleQuery).lean();

        // 3. Attach Readings to Transformers
        const transformersWithReadings = transformers.map(transformer => {
            // Find matching test data based on internalCoreNo matching uniqueId
            // Note: uniqueId format is typically TR-JOB-xxxx-yyy, internalCoreNo in tests might vary
            // We'll try exact match first, then check if uniqueId contains internalCoreNo

            let coreTestReadings = null;
            let testType = null;

            // Check Metering
            const meteringMatch = meteringTests.find(test =>
                Array.isArray(test.readings) && test.readings.some(r => r.internalCoreNo === transformer.uniqueId || transformer.uniqueId.includes(r.internalCoreNo))
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
                    Array.isArray(test.readings) && test.readings.some(r => r.internalCoreNo === transformer.uniqueId || transformer.uniqueId.includes(r.internalCoreNo))
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

        if (!transformer.testHistory) {
            transformer.testHistory = {};
        }

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

        if (order) {
            if (order.assignments) {
                // Find the specific assignment entry for this tester and stage
                const assignment = order.assignments.find(a =>
                    (a.testerName === testerName || a.testerName === user.fullName) &&
                    a.stage === stage
                );

                if (assignment && assignment.unitRange) {
                    // Verify if ALL transformers in this range are now done
                    const { from, to } = assignment.unitRange;
                    const jobId = order.jobId;

                    const idsInRange = [];
                    for (let i = from; i <= to; i++) {
                        idsInRange.push(`TR-${jobId}-${String(i).padStart(3, '0')}`);
                    }

                    const pendingCountInRange = await TransformerModel.countDocuments({
                        uniqueId: { $in: idsInRange },
                        currentStage: stage
                    });

                    if (pendingCountInRange === 0) {
                        assignment.status = "Completed";
                        console.log(`Assignment for ${testerName} on ${jobId} (${stage}) marked as Completed.`);
                    }
                }
            }

            // 3. Send Notification to Next Stage (As soon as the FIRST unit arrives)
            if (nextStage !== 'admin_review' && nextStage !== 'shipped') {
                const { NotificationModel } = require('../models/NotificationModel');
                const existingNotification = await NotificationModel.findOne({
                    orderId: order._id,
                    recipientRole: nextStage,
                    type: 'ASSIGNMENT'
                });

                if (!existingNotification) {
                    const { notifyNextStage } = require('../services/notificationService');
                    // We call notifyNextStage which will handle creating notifications for assigned testers
                    // But we'll override the message style in the service or just call it here manually
                    // To follow the user's request for "only order information"
                    const nextStageAssignments = order.assignments.filter(a => a.stage === nextStage);
                    for (const assignment of nextStageAssignments) {
                        await NotificationModel.create({
                            recipientName: assignment.testerName,
                            recipientRole: nextStage,
                            message: `New testing task assigned: Job ${order.jobId} (${order.clientName || 'Active Order'})`,
                            type: 'ASSIGNMENT',
                            orderId: order._id,
                            jobId: order.jobId
                        });
                    }
                    console.log(`[NOTIFICATION] First unit reached ${nextStage}. Assignment notification sent for ${order.jobId}.`);
                }
            }

            // 4. GLOBAL ORDER STAGE TRANSITION (If ALL units are done)
            const tripleQuery = {
                $or: [
                    { orderId: order._id },
                    { orderId: order._id.toString() },
                    { jobId: order.jobId }
                ],
                currentStage: stage
            };
            const pendingTotalCount = await TransformerModel.countDocuments(tripleQuery);

            if (pendingTotalCount === 0 && nextStage !== 'admin_review') {
                // Also check if any unit is in admin_review. If so, order must wait for transition.
                const adminReviewCount = await TransformerModel.countDocuments({
                    $or: [
                        { orderId: order._id },
                        { orderId: order._id.toString() },
                        { jobId: order.jobId }
                    ],
                    currentStage: 'admin_review'
                });

                if (adminReviewCount === 0) {
                    console.log(`Order ${order.jobId} transitioning from ${stage} to ${nextStage}`);

                    // Also update completionStages flags
                    if (order.completionStages) {
                        if (stage === 'core') order.completionStages.core = true;
                        if (stage === 'secondary') order.completionStages.secondary = true;
                        if (stage === 'primary') order.completionStages.primary = true;
                        if (stage === 'heating') order.completionStages.heating = true;
                        if (stage === 'final') order.completionStages.final = true;
                    }

                    const { clearNotifications, handleOrderCompletion } = require('../services/notificationService');
                    
                    // Clear notifications for the current stage/order
                    await clearNotifications(order._id, stage);

                    if (stage === 'final') {
                        const oldStatus = order.status;
                        order.currentStage = 'completed';
                        order.status = 'COMPLETED'; // Normalize to Uppercase
                        
                        // Trigger completion notification with old status for transition check
                        await handleOrderCompletion(order, oldStatus);
                    } else {
                        order.currentStage = nextStage;
                        // Notification already sent above when the first unit arrived
                    }
                }
            }

            await order.save();
        }

        res.json({ success: true, message: "Transformer approved and stage updated." });

    } catch (error) {
        console.error("Error approving stage:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/transformers/admin-review
// Fetch all transformers currently pending admin review
router.get('/admin-review', isAuthenticated, async (req, res) => {
    try {
        const transformers = await TransformerModel.find({ currentStage: 'admin_review' })
            .populate('orderId')
            .lean();
        res.json({ success: true, data: transformers });
    } catch (error) {
        console.error("Error fetching admin review transformers:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/transformers/:uniqueId/approve-retest
// Allows Admin to approve a retest for a transformer locked in 'admin_review'
router.put('/:uniqueId/approve-retest', isAuthenticated, async (req, res) => {
    try {
        const { uniqueId } = req.params;
        const { newTester } = req.body; // Optional: If admin wants to reassign

        // 1. Find Transformer
        const transformer = await TransformerModel.findOne({ uniqueId });
        if (!transformer) {
            return res.status(404).json({ success: false, message: "Transformer not found" });
        }

        if (transformer.currentStage !== 'admin_review' || !transformer.adminReviewDetails) {
            return res.status(400).json({ success: false, message: "Transformer is not pending admin review." });
        }

        const targetStage = transformer.adminReviewDetails.returnTargetStage || "primary";

        // 2. Reassign if requested (Updates the specific transformer's assignment for that stage)
        if (newTester) {
            transformer.assignments = transformer.assignments || {};
            transformer.assignments[`${targetStage}_tester`] = newTester;
        }

        // 3. Update Stage back to the target testing stage
        transformer.currentStage = targetStage;

        // 4. Clear Review Details
        transformer.adminReviewDetails = undefined;

        await transformer.save();

        // 5. Update the FailedCore record to show 'APPROVED' for audit trail
        const { FailedCoreModel } = require('../models/FailedCoreModel'); // Ensure this is imported
        await FailedCoreModel.updateMany(
            {
                internalCoreNo: uniqueId,
                // We only want to approve the most recent failure that caused this lock
                adminApprovalStatus: { $in: ["PENDING", "NOT_REQUIRED"] }
            },
            {
                $set: {
                    adminApprovalStatus: "APPROVED",
                    retestStatus: "PENDING" // Now waiting for the retest
                }
            }
        );

        res.json({
            success: true,
            message: `Retest approved. Transformer moved to ${targetStage} stage.`,
            stage: targetStage
        });

    } catch (error) {
        console.error("Error approving retest:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

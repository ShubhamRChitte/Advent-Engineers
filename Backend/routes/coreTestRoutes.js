// routes/coreTestRoutes.js
const express = require('express');
const router = express.Router();
const { OrderModel } = require('../models/OrderModel');

const { isAuthenticated } = require('../middlewares/authMiddleware');

// PUT /api/core-tests/approve/:orderId
// Granular Approval: Updates only the transformers assigned to the current user
router.put('/approve/:orderId', isAuthenticated, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { TransformerModel } = require('../models/TransformerModel');

        // 1. Identify User and Stage
        const user = req.user;
        const testerName = user.name || user.fullName; // Fallback handled

        // 2. BULK UPDATE
        // Update transformers for this order, in 'core' stage, AND assigned to this user
        const updateQuery = {
            orderId: orderId,
            currentStage: 'core',
            "assignments.core_tester": testerName // Strict User Check
        };

        const updateResult = await TransformerModel.updateMany(
            updateQuery,
            {
                $set: { currentStage: 'secondary' }
            }
        );

        // Check if ANY transformers are left in 'core' for this order.
        const remainingCoreUnits = await TransformerModel.countDocuments({
            orderId: orderId,
            currentStage: 'core'
        });

        // Update Order Status only if ALL units are done (Optional, but good for tracking)
        // OR better: Update Order status to "Partial" or keep "In Progress".
        // If remaining == 0, then we can mark Order as Core Testing Completed.
        let orderUpdate = null;
        if (remainingCoreUnits === 0) {

            // --- AGGREGATE CORE TEST DATA FOR REPORT ---
            const { MeteringCoreTestModel } = require('../models/MeteringCoreTestModel');
            const { ProtectionCoreTestModel } = require('../models/ProtectionCoreTestModel');

            const [meteringTests, protectionTests] = await Promise.all([
                MeteringCoreTestModel.find({ orderId: orderId }).lean(),
                ProtectionCoreTestModel.find({ orderId: orderId }).lean()
            ]);

            const allCores = [];

            // Helper to format Date
            const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB') : '';

            // Map Metering Tests
            meteringTests.forEach(test => {
                allCores.push({
                    coreName: 'Metering',
                    coreType: 'Metering',
                    testSetup: test.testSetup || {},
                    testLimits: test.testLimits || {},
                    testedBy: test.testedBy,
                    tableData: (test.readings || []).map(r => ({
                        date: formatDate(r.date),
                        vendorCoreNo: r.vendorCoreNo,
                        internalCoreNo: r.internalCoreNo,
                        measuredMa: r.measuredMa || [],
                        result: r.result
                    }))
                });
            });

            // Map Protection and PS Tests
            protectionTests.forEach(test => {
                allCores.push({
                    coreName: test.coreType, // Protection or PS
                    coreType: test.coreType,
                    testSetup: test.testSetup || {},
                    testSpecification: test.testSpecification || {},
                    testedBy: test.testedBy,
                    tableData: (test.readings || []).map(r => ({
                        date: formatDate(r.date),
                        vendorCoreNo: r.vendorCoreNo,
                        internalCoreNo: r.internalCoreNo,
                        value: r.value,
                        result: r.result
                    }))
                });
            });

            const { notifyNextStage, clearNotifications } = require('../services/notificationService');

            orderUpdate = await OrderModel.findByIdAndUpdate(
                orderId,
                {
                    $set: {
                        currentStage: "secondary",
                        status: "Core Testing Completed",
                        "completionStages.core": true,
                        reportData: allCores, // Save the aggregated array!
                        approved: true // Set approved to true here to move to Orders tab
                    }
                },
                { new: true }
            );

            // 1. Clear current stage notifications (for core testers)
            await clearNotifications(orderId, 'core');

            // 2. Notify secondary testers
            if (orderUpdate) {
                await notifyNextStage(orderUpdate, 'secondary');
            }
        }

        res.status(200).json({
            success: true,
            message: `Approved ${updateResult.modifiedCount} units.`,
            orderUpdated: !!orderUpdate,
            data: orderUpdate
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/core-tests/orders/approved
// Fetch all orders that have completed core testing
router.get('/orders/approved', isAuthenticated, async (req, res) => {
    try {
        // Find orders where approved is true
        const completedOrders = await OrderModel.find({
            approved: true
        }).sort({ updatedAt: -1 });

        console.log("Approved Orders:", completedOrders.length);

        res.status(200).json(completedOrders);
    } catch (err) {
        console.error("Error fetching completed orders:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/core-tests/approved-ids/:orderId
// Retrieves all approved core IDs (from Core Testing stage) for the given orderId
router.get('/approved-ids/:orderId', isAuthenticated, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { MeteringCoreTestModel } = require('../models/MeteringCoreTestModel');
        const { ProtectionCoreTestModel } = require('../models/ProtectionCoreTestModel');

        const [meteringDocs, protectionDocs] = await Promise.all([
            MeteringCoreTestModel.find({ orderId }).lean(),
            ProtectionCoreTestModel.find({ orderId }).lean()
        ]);

        const meteringIds = [];
        const psIds = [];
        const protectionIds = [];

        meteringDocs.forEach(doc => {
            (doc.readings || []).forEach(r => {
                if ((r.result === 'P' || r.status === 'PASS' || r.status === 'PENDING') && r.internalCoreNo) {
                    meteringIds.push(r.internalCoreNo);
                }
            });
        });

        protectionDocs.forEach(doc => {
            const type = (doc.coreType || 'Protection').toLowerCase();
            (doc.readings || []).forEach(r => {
                if ((r.result === 'P' || r.status === 'PASS' || r.status === 'PENDING') && r.internalCoreNo) {
                    if (type === 'ps') {
                        psIds.push(r.internalCoreNo);
                    } else {
                        protectionIds.push(r.internalCoreNo);
                    }
                }
            });
        });

        res.json({
            success: true,
            metering: [...new Set(meteringIds)],
            ps: [...new Set(psIds)],
            protection: [...new Set(protectionIds)]
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

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
            const ReadyTransformerModel = require('../models/ReadyTransformerModel');

            const [meteringTests, protectionTests, readyCores] = await Promise.all([
                MeteringCoreTestModel.find({ orderId: orderId }).lean(),
                ProtectionCoreTestModel.find({ orderId: orderId }).lean(),
                ReadyTransformerModel.find({ linkedOrderId: orderId }).lean()
            ]);

            const allCores = [];

            // Helper to format Date
            const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB') : '';

            // Group ready stock cores by type
            const readyMetering = readyCores.filter(c => c.coreType === 'Metering');
            const readyPs = readyCores.filter(c => c.coreType === 'PS');
            const readyProtection = readyCores.filter(c => c.coreType === 'Protection');

            // 1. Process Metering Cores
            if (meteringTests.length > 0) {
                meteringTests.forEach(test => {
                    const tableData = (test.readings || []).map(r => ({
                        date: formatDate(r.date),
                        vendorCoreNo: r.vendorCoreNo,
                        internalCoreNo: r.internalCoreNo,
                        measuredMa: r.measuredMa || [],
                        result: r.result
                    }));

                    readyMetering.forEach(core => {
                        if (!tableData.some(row => row.internalCoreNo === core.coreId)) {
                            tableData.push({
                                date: formatDate(core.testedAt || core.createdAt),
                                vendorCoreNo: core.testResults?.vendorCoreNo || core.batchId || '',
                                internalCoreNo: core.coreId,
                                measuredMa: core.testResults?.measuredMa || [],
                                result: core.testResults?.result || 'P'
                            });
                        }
                    });

                    allCores.push({
                        coreName: 'Metering',
                        coreType: 'Metering',
                        testSetup: test.testSetup || {},
                        testLimits: test.testLimits || {},
                        testedBy: test.testedBy || (readyMetering[0] ? (readyMetering[0].testedBy || readyMetering[0].testResults?.testedBy) : 'Pre-Tested'),
                        tableData
                    });
                });
            } else if (readyMetering.length > 0) {
                const firstReady = readyMetering[0];
                const tableData = readyMetering.map(core => ({
                    date: formatDate(core.testedAt || core.createdAt),
                    vendorCoreNo: core.testResults?.vendorCoreNo || core.batchId || '',
                    internalCoreNo: core.coreId,
                    measuredMa: core.testResults?.measuredMa || [],
                    result: core.testResults?.result || 'P'
                }));
                allCores.push({
                    coreName: 'Metering',
                    coreType: 'Metering',
                    testSetup: {
                        coreSizeMm: firstReady.testSetup?.coreSizeMm || { id: '', od: '', height: '' },
                        turnsUsed: firstReady.testSetup?.turnsUsed || firstReady.specifications?.turns || '',
                        areaSqCm: firstReady.testSetup?.areaSqCm || '',
                        mmp: firstReady.testSetup?.mmp || '',
                        coreMaterial: firstReady.testSetup?.coreMaterial || ''
                    },
                    testLimits: firstReady.testLimits || { bsatGauss: [], setMilliVolt: [], leLimitMa: [] },
                    testedBy: firstReady.testedBy || firstReady.testResults?.testedBy || 'Pre-Tested',
                    tableData
                });
            }

            // 2. Process PS Cores
            const psTests = protectionTests.filter(test => test.coreType === 'PS');
            if (psTests.length > 0) {
                psTests.forEach(test => {
                    const tableData = (test.readings || []).map(r => ({
                        date: formatDate(r.date),
                        vendorCoreNo: r.vendorCoreNo,
                        internalCoreNo: r.internalCoreNo,
                        value: r.value,
                        result: r.result
                    }));

                    readyPs.forEach(core => {
                        if (!tableData.some(row => row.internalCoreNo === core.coreId)) {
                            tableData.push({
                                date: formatDate(core.testedAt || core.createdAt),
                                vendorCoreNo: core.testResults?.vendorCoreNo || core.batchId || '',
                                internalCoreNo: core.coreId,
                                value: core.testResults?.value || core.testResults?.singleValue || '',
                                result: core.testResults?.result || 'P'
                            });
                        }
                    });

                    allCores.push({
                        coreName: 'PS',
                        coreType: 'PS',
                        testSetup: test.testSetup || {},
                        testSpecification: test.testSpecification || {},
                        testedBy: test.testedBy || (readyPs[0] ? (readyPs[0].testedBy || readyPs[0].testResults?.testedBy) : 'Pre-Tested'),
                        tableData
                    });
                });
            } else if (readyPs.length > 0) {
                const firstReady = readyPs[0];
                const tableData = readyPs.map(core => ({
                    date: formatDate(core.testedAt || core.createdAt),
                    vendorCoreNo: core.testResults?.vendorCoreNo || core.batchId || '',
                    internalCoreNo: core.coreId,
                    value: core.testResults?.value || core.testResults?.singleValue || '',
                    result: core.testResults?.result || 'P'
                }));
                allCores.push({
                    coreName: 'PS',
                    coreType: 'PS',
                    testSetup: {
                        coreSizeMm: firstReady.testSetup?.coreSizeMm || { id: '', od: '', height: '' },
                        turnsUsed: firstReady.testSetup?.turnsUsed || firstReady.specifications?.turns || '',
                        areaSqCm: firstReady.testSetup?.areaSqCm || '',
                        mmp: firstReady.testSetup?.mmp || '',
                        coreMaterial: firstReady.testSetup?.coreMaterial || ''
                    },
                    testSpecification: firstReady.testLimits || firstReady.testSpecification || { fluxTesla: '', voltageV: '', iexLimitMa: '' },
                    testedBy: firstReady.testedBy || firstReady.testResults?.testedBy || 'Pre-Tested',
                    tableData
                });
            }

            // 3. Process Protection Cores
            const protTests = protectionTests.filter(test => test.coreType === 'Protection');
            if (protTests.length > 0) {
                protTests.forEach(test => {
                    const tableData = (test.readings || []).map(r => ({
                        date: formatDate(r.date),
                        vendorCoreNo: r.vendorCoreNo,
                        internalCoreNo: r.internalCoreNo,
                        value: r.value,
                        result: r.result
                    }));

                    readyProtection.forEach(core => {
                        if (!tableData.some(row => row.internalCoreNo === core.coreId)) {
                            tableData.push({
                                date: formatDate(core.testedAt || core.createdAt),
                                vendorCoreNo: core.testResults?.vendorCoreNo || core.batchId || '',
                                internalCoreNo: core.coreId,
                                value: core.testResults?.value || core.testResults?.singleValue || '',
                                result: core.testResults?.result || 'P'
                            });
                        }
                    });

                    allCores.push({
                        coreName: 'Protection',
                        coreType: 'Protection',
                        testSetup: test.testSetup || {},
                        testSpecification: test.testSpecification || {},
                        testedBy: test.testedBy || (readyProtection[0] ? (readyProtection[0].testedBy || readyProtection[0].testResults?.testedBy) : 'Pre-Tested'),
                        tableData
                    });
                });
            } else if (readyProtection.length > 0) {
                const firstReady = readyProtection[0];
                const tableData = readyProtection.map(core => ({
                    date: formatDate(core.testedAt || core.createdAt),
                    vendorCoreNo: core.testResults?.vendorCoreNo || core.batchId || '',
                    internalCoreNo: core.coreId,
                    value: core.testResults?.value || core.testResults?.singleValue || '',
                    result: core.testResults?.result || 'P'
                }));
                allCores.push({
                    coreName: 'Protection',
                    coreType: 'Protection',
                    testSetup: {
                        coreSizeMm: firstReady.testSetup?.coreSizeMm || { id: '', od: '', height: '' },
                        turnsUsed: firstReady.testSetup?.turnsUsed || firstReady.specifications?.turns || '',
                        areaSqCm: firstReady.testSetup?.areaSqCm || '',
                        mmp: firstReady.testSetup?.mmp || '',
                        coreMaterial: firstReady.testSetup?.coreMaterial || ''
                    },
                    testSpecification: firstReady.testLimits || firstReady.testSpecification || { fluxTesla: '', voltageV: '', iexLimitMa: '' },
                    testedBy: firstReady.testedBy || firstReady.testResults?.testedBy || 'Pre-Tested',
                    tableData
                });
            }

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
        const ReadyTransformerModel = require('../models/ReadyTransformerModel');

        const [meteringDocs, protectionDocs, readyCores] = await Promise.all([
            MeteringCoreTestModel.find({ orderId }).lean(),
            ProtectionCoreTestModel.find({ orderId }).lean(),
            ReadyTransformerModel.find({ linkedOrderId: orderId }).lean()
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

        readyCores.forEach(core => {
            if (core.coreType === 'Metering') {
                meteringIds.push(core.coreId);
            } else if (core.coreType === 'PS') {
                psIds.push(core.coreId);
            } else if (core.coreType === 'Protection') {
                protectionIds.push(core.coreId);
            }
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

// GET /api/core-tests/report/:jobId
// Fetch a specific order report by jobId
router.get('/report/:jobId', isAuthenticated, async (req, res) => {
    try {
        const { jobId } = req.params;
        const order = await OrderModel.findOne({ jobId });

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.status(200).json(order);
    } catch (err) {
        console.error("Error fetching report:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

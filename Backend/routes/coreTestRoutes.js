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

        // Mark assigned ready stock cores for this order as used
        const ReadyTransformerModel = require('../models/ReadyTransformerModel');
        await ReadyTransformerModel.updateMany(
            { linkedOrderId: orderId },
            { $set: { status: "used" } }
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
                const { PreTestBatchModel } = require('../models/PreTestBatchModel');
                const batch = await PreTestBatchModel.findOne({ batchId: firstReady.batchId }).lean();

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
                        coreSizeMm: batch?.testSetup?.coreSizeMm || firstReady.testSetup?.coreSizeMm || { id: '', od: '', height: '' },
                        turnsUsed: batch?.testSetup?.turnsUsed || firstReady.testSetup?.turnsUsed || firstReady.specifications?.turns || '',
                        areaSqCm: batch?.testSetup?.areaSqCm || firstReady.testSetup?.areaSqCm || '',
                        mmp: batch?.testSetup?.mmp || firstReady.testSetup?.mmp || '',
                        coreMaterial: batch?.testSetup?.coreMaterial || firstReady.testSetup?.coreMaterial || ''
                    },
                    testLimits: batch?.testLimits || firstReady.testLimits || { bsatGauss: [], setMilliVolt: [], leLimitMa: [] },
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
                                value: core.testResults?.value || core.testResults?.singleValue || core.testResults?.measuredMa?.[0] || '',
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
                const { PreTestBatchModel } = require('../models/PreTestBatchModel');
                const batch = await PreTestBatchModel.findOne({ batchId: firstReady.batchId }).lean();

                const tableData = readyPs.map(core => ({
                    date: formatDate(core.testedAt || core.createdAt),
                    vendorCoreNo: core.testResults?.vendorCoreNo || core.batchId || '',
                    internalCoreNo: core.coreId,
                    value: core.testResults?.value || core.testResults?.singleValue || core.testResults?.measuredMa?.[0] || '',
                    result: core.testResults?.result || 'P'
                }));
                allCores.push({
                    coreName: 'PS',
                    coreType: 'PS',
                    testSetup: {
                        coreSizeMm: batch?.testSetup?.coreSizeMm || firstReady.testSetup?.coreSizeMm || { id: '', od: '', height: '' },
                        turnsUsed: batch?.testSetup?.turnsUsed || firstReady.testSetup?.turnsUsed || firstReady.specifications?.turns || '',
                        areaSqCm: batch?.testSetup?.areaSqCm || firstReady.testSetup?.areaSqCm || '',
                        mmp: batch?.testSetup?.mmp || firstReady.testSetup?.mmp || '',
                        coreMaterial: batch?.testSetup?.coreMaterial || firstReady.testSetup?.coreMaterial || ''
                    },
                    testSpecification: batch?.testLimits || batch?.testSpecification || firstReady.testLimits || firstReady.testSpecification || { fluxTesla: '', voltageV: '', iexLimitMa: '' },
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
                                value: core.testResults?.value || core.testResults?.singleValue || core.testResults?.measuredMa?.[0] || '',
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
                const { PreTestBatchModel } = require('../models/PreTestBatchModel');
                const batch = await PreTestBatchModel.findOne({ batchId: firstReady.batchId }).lean();

                const tableData = readyProtection.map(core => ({
                    date: formatDate(core.testedAt || core.createdAt),
                    vendorCoreNo: core.testResults?.vendorCoreNo || core.batchId || '',
                    internalCoreNo: core.coreId,
                    value: core.testResults?.value || core.testResults?.singleValue || core.testResults?.measuredMa?.[0] || '',
                    result: core.testResults?.result || 'P'
                }));
                allCores.push({
                    coreName: 'Protection',
                    coreType: 'Protection',
                    testSetup: {
                        coreSizeMm: batch?.testSetup?.coreSizeMm || firstReady.testSetup?.coreSizeMm || { id: '', od: '', height: '' },
                        turnsUsed: batch?.testSetup?.turnsUsed || firstReady.testSetup?.turnsUsed || firstReady.specifications?.turns || '',
                        areaSqCm: batch?.testSetup?.areaSqCm || firstReady.testSetup?.areaSqCm || '',
                        mmp: batch?.testSetup?.mmp || firstReady.testSetup?.mmp || '',
                        coreMaterial: batch?.testSetup?.coreMaterial || firstReady.testSetup?.coreMaterial || ''
                    },
                    testSpecification: batch?.testLimits || batch?.testSpecification || firstReady.testLimits || firstReady.testSpecification || { fluxTesla: '', voltageV: '', iexLimitMa: '' },
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

        const { FailedCoreModel } = require('../models/FailedCoreModel');

        const mongoose = require('mongoose');
        const { TransformerModel } = require('../models/TransformerModel');
        const { OrderModel } = require('../models/OrderModel');

        const validObjectId = mongoose.Types.ObjectId.isValid(orderId) ? new mongoose.Types.ObjectId(orderId) : null;
        const order = await OrderModel.findById(orderId).lean();

        const orderFilter = {
            $or: [
                { orderId: orderId },
                ...(validObjectId ? [{ orderId: validObjectId }] : []),
                ...(order?.jobId ? [{ batchId: order.jobId }] : [])
            ]
        };

        const [meteringDocs, protectionDocs, readyCores, failedDocs, transformers] = await Promise.all([
            MeteringCoreTestModel.find(orderFilter).lean(),
            ProtectionCoreTestModel.find(orderFilter).lean(),
            ReadyTransformerModel.find({ $or: [{ linkedOrderId: orderId }, ...(validObjectId ? [{ linkedOrderId: validObjectId }] : [])] }).lean(),
            FailedCoreModel.find({
                $or: [
                    { orderId: orderId },
                    ...(validObjectId ? [{ orderId: validObjectId }] : []),
                    ...(order?.jobId ? [{ jobId: order.jobId }, { orderNumber: order.jobId }] : [])
                ],
                status: 'FAILED'
            }).select('internalCoreNo coreId vendorCoreNo').lean(),
            TransformerModel.find(orderFilter).lean()
        ]);

        const failedCoreIds = new Set();

        // 1. Collect from FailedCoreModel (strictly for THIS order's active FAILED status)
        failedDocs.forEach(f => {
          if (f.internalCoreNo) failedCoreIds.add(String(f.internalCoreNo).trim());
          if (f.coreId) failedCoreIds.add(String(f.coreId).trim());
          if (f.vendorCoreNo && f.vendorCoreNo !== 'N/A') failedCoreIds.add(String(f.vendorCoreNo).trim());
        });

        // 2. Collect from ReadyTransformerModel (failed status)
        readyCores.forEach(r => {
          if (r.status === 'failed' || r.status === 'Fail' || r.status === 'FAILED') {
            if (r.coreId) failedCoreIds.add(String(r.coreId).trim());
          }
        });

        // 3. Collect from TransformerModel retestHistory for replaced cores
        transformers.forEach(t => {
          if (t.retestHistory && Array.isArray(t.retestHistory)) {
            t.retestHistory.forEach(rh => {
              if (rh.oldCoreId && rh.oldCoreId !== 'N/A') {
                failedCoreIds.add(String(rh.oldCoreId).trim());
              }
            });
          }
        });

        // 4. Collect from readings marked as FAIL/F in Core Tests
        meteringDocs.forEach(doc => {
          (doc.readings || []).forEach(r => {
            if (r.status === 'FAIL' || r.result === 'F') {
              if (r.internalCoreNo) failedCoreIds.add(String(r.internalCoreNo).trim());
            }
          });
        });
        protectionDocs.forEach(doc => {
          (doc.readings || []).forEach(r => {
            if (r.status === 'FAIL' || r.result === 'F') {
              if (r.internalCoreNo) failedCoreIds.add(String(r.internalCoreNo).trim());
            }
          });
        });

        const meteringIds = [];
        const psIds = [];
        const protectionIds = [];

        // Collect assigned cores from order.reportData (saved during Core Testing stage)
        if (order && Array.isArray(order.reportData)) {
          order.reportData.forEach(coreGroup => {
            const groupType = (coreGroup.coreType || coreGroup.coreName || '').toLowerCase();
            (coreGroup.tableData || []).forEach(row => {
              const cId = row.internalCoreNo ? String(row.internalCoreNo).trim() : '';
              if (cId && !failedCoreIds.has(cId) && row.result !== 'F' && row.result !== 'FAIL') {
                if (groupType.includes('metering')) {
                  meteringIds.push(cId);
                } else if (groupType.includes('ps') || cId.toLowerCase().includes('-ps-') || cId.toLowerCase().includes('_ps_')) {
                  psIds.push(cId);
                } else if (groupType.includes('protection') || groupType.includes('prt')) {
                  protectionIds.push(cId);
                }
              }
            });
          });
        }

        meteringDocs.forEach(doc => {
            (doc.readings || []).forEach(r => {
                const cId = r.internalCoreNo ? String(r.internalCoreNo).trim() : '';
                if ((r.result === 'P' || r.status === 'PASS' || r.status === 'PENDING') && cId && !failedCoreIds.has(cId)) {
                    meteringIds.push(cId);
                }
            });
        });

        protectionDocs.forEach(doc => {
            const type = (doc.coreType || 'Protection').toLowerCase();
            (doc.readings || []).forEach(r => {
                const cId = r.internalCoreNo ? String(r.internalCoreNo).trim() : '';
                const cIdLow = cId.toLowerCase();
                if ((r.result === 'P' || r.status === 'PASS' || r.status === 'PENDING') && cId && !failedCoreIds.has(cId)) {
                    if (type === 'ps' || cIdLow.includes('-ps-') || cIdLow.includes('_ps_') || cIdLow.endsWith('-ps') || cIdLow.includes('ps')) {
                        psIds.push(cId);
                    } else {
                        protectionIds.push(cId);
                    }
                }
            });
        });

        readyCores.forEach(core => {
            const cId = core.coreId ? String(core.coreId).trim() : '';
            const cIdLow = cId.toLowerCase();
            const typeStr = (core.coreType || '').toLowerCase();
            if (cId && (core.status === 'reserved' || core.status === 'used' || core.status === 'available') && !failedCoreIds.has(cId)) {
                if (typeStr === 'metering' || cIdLow.includes('mtr') || cIdLow.includes('meter')) {
                    meteringIds.push(cId);
                } else if (typeStr === 'ps' || cIdLow.includes('-ps-') || cIdLow.includes('_ps_') || cIdLow.includes('ps')) {
                    psIds.push(cId);
                } else if (typeStr === 'protection' || cIdLow.includes('prt') || cIdLow.includes('protect')) {
                    protectionIds.push(cId);
                }
            }
        });

        // Determine required total core counts per type for the full order (coresPerUnit * totalUnits)
        const totalUnits = order ? (order.quantity || order.transformerCount || 10) : 10;
        let coresPerUnitMetering = 0;
        let coresPerUnitPs = 0;
        let coresPerUnitProtection = 0;

        if (order && Array.isArray(order.coreDetails) && order.coreDetails.length > 0) {
          order.coreDetails.forEach(cd => {
            const t = (cd.coreType || '').toLowerCase();
            const isPS = t.includes('ps') || (t.includes('protection') && (cd.iexLimit || cd.leLimit || cd.class === 'PS' || (cd.description && cd.description.includes('PS'))));
            if (isPS) coresPerUnitPs++;
            else if (t.includes('protection') || t.includes('prt')) coresPerUnitProtection++;
            else if (t.includes('metering') || t.includes('mtr')) coresPerUnitMetering++;
            else coresPerUnitMetering++;
          });
        }

        let reqMetering = coresPerUnitMetering * totalUnits;
        let reqPs = coresPerUnitPs * totalUnits;
        let reqProtection = coresPerUnitProtection * totalUnits;

        let uniqueMetering = reqMetering > 0 ? [...new Set(meteringIds)] : [];
        let uniquePs = reqPs > 0 ? [...new Set(psIds)] : [];
        let uniqueProtection = reqProtection > 0 ? [...new Set(protectionIds)] : [];

        // Trim to total required count for the order if count exceeds
        if (reqMetering > 0 && uniqueMetering.length > reqMetering) {
          uniqueMetering = uniqueMetering.slice(0, reqMetering);
        }
        if (reqPs > 0 && uniquePs.length > reqPs) {
          uniquePs = uniquePs.slice(0, reqPs);
        }
        if (reqProtection > 0 && uniqueProtection.length > reqProtection) {
          uniqueProtection = uniqueProtection.slice(0, reqProtection);
        }

        res.json({
            success: true,
            metering: uniqueMetering,
            ps: uniquePs,
            protection: uniqueProtection
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

        if (order && Array.isArray(order.reportData) && order.reportData.length > 0) {
            let modified = false;
            const updatedReportData = [...order.reportData];

            for (let idx = 0; idx < updatedReportData.length; idx++) {
                const core = updatedReportData[idx];
                const ReadyTransformerModel = require('../models/ReadyTransformerModel');
                const { PreTestBatchModel } = require('../models/PreTestBatchModel');

                if (core.coreType === 'Metering') {
                    // Heal Limits if missing
                    if (!core.testLimits || !core.testLimits.bsatGauss || core.testLimits.bsatGauss.length === 0) {
                        let readyCore = null;
                        for (const row of (core.tableData || [])) {
                            if (row.internalCoreNo) {
                                readyCore = await ReadyTransformerModel.findOne({ coreId: row.internalCoreNo }).lean();
                                if (readyCore) break;
                            }
                        }
                        if (readyCore) {
                            const batch = await PreTestBatchModel.findOne({ batchId: readyCore.batchId }).lean();
                            if (batch && batch.testLimits) {
                                core.testLimits = batch.testLimits;
                                core.testSetup = {
                                    coreSizeMm: batch.testSetup?.coreSizeMm || core.testSetup?.coreSizeMm || { id: '', od: '', height: '' },
                                    turnsUsed: batch.testSetup?.turnsUsed || core.testSetup?.turnsUsed || '',
                                    areaSqCm: batch.testSetup?.areaSqCm || core.testSetup?.areaSqCm || '',
                                    mmp: batch.testSetup?.mmp || core.testSetup?.mmp || '',
                                    coreMaterial: batch.testSetup?.coreMaterial || core.testSetup?.coreMaterial || ''
                                };
                                modified = true;
                            }
                        }
                    }

                    // Heal row-level measuredMa if missing or empty
                    for (const row of (core.tableData || [])) {
                        if (row.internalCoreNo && (!row.measuredMa || row.measuredMa.length === 0)) {
                            const readyCore = await ReadyTransformerModel.findOne({ coreId: row.internalCoreNo }).lean();
                            if (readyCore && readyCore.testResults) {
                                row.measuredMa = readyCore.testResults.measuredMa || [];
                                modified = true;
                            }
                        }
                    }

                } else if (core.coreType === 'PS' || core.coreType === 'Protection') {
                    // Heal Specification if missing
                    if (!core.testSpecification || !core.testSpecification.fluxTesla) {
                        let readyCore = null;
                        for (const row of (core.tableData || [])) {
                            if (row.internalCoreNo) {
                                readyCore = await ReadyTransformerModel.findOne({ coreId: row.internalCoreNo }).lean();
                                if (readyCore) break;
                            }
                        }
                        if (readyCore) {
                            const batch = await PreTestBatchModel.findOne({ batchId: readyCore.batchId }).lean();
                            if (batch && batch.testLimits) {
                                core.testSpecification = batch.testLimits || batch.testSpecification || { fluxTesla: '', voltageV: '', iexLimitMa: '' };
                                core.testSetup = {
                                    coreSizeMm: batch.testSetup?.coreSizeMm || core.testSetup?.coreSizeMm || { id: '', od: '', height: '' },
                                    turnsUsed: batch.testSetup?.turnsUsed || core.testSetup?.turnsUsed || '',
                                    areaSqCm: batch.testSetup?.areaSqCm || core.testSetup?.areaSqCm || '',
                                    mmp: batch.testSetup?.mmp || core.testSetup?.mmp || '',
                                    coreMaterial: batch.testSetup?.coreMaterial || core.testSetup?.coreMaterial || ''
                                };
                                modified = true;
                            }
                        }
                    }

                    // Heal row-level value if missing, empty, or '-'
                    for (const row of (core.tableData || [])) {
                        if (row.internalCoreNo && (!row.value || row.value === '-' || row.value === '')) {
                            const readyCore = await ReadyTransformerModel.findOne({ coreId: row.internalCoreNo }).lean();
                            if (readyCore && readyCore.testResults) {
                                row.value = String(readyCore.testResults.value || readyCore.testResults.singleValue || readyCore.testResults.measuredMa?.[0] || '-');
                                modified = true;
                            }
                        }
                    }
                }
            }

            if (modified) {
                await OrderModel.findByIdAndUpdate(order._id, { $set: { reportData: updatedReportData } });
                const updatedOrder = await OrderModel.findById(order._id).lean();
                return res.status(200).json(updatedOrder);
            }
        }

        res.status(200).json(order);
    } catch (err) {
        console.error("Error fetching report:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

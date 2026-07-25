const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { TransformerModel } = require('../models/TransformerModel');
const { FailedTransformerModel } = require('../models/FailedTransformerModel');
const { escapeRegExp } = require('../utils/regexHelper');
const { OrderModel } = require('../models/OrderModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// POST /api/failed-transformers
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const {
            transformerId,
            transformerUniqueId,
            orderId,
            jobNumber,
            clientName,
            coreType,
            testType,
            failureParameters,
            failureReason,
            remark,
            reportedBy,
            stage,
            status
        } = req.body;

        if (!transformerId || !coreType || !failureReason || !reportedBy) {
            return res.status(400).json({ success: false, message: "Missing required fields: transformerId, coreType, failureReason, reportedBy" });
        }

        // 1. Resolve Transformer safely (by ObjectId _id or uniqueId string)
        let transformer = null;
        if (mongoose.Types.ObjectId.isValid(transformerId)) {
            transformer = await TransformerModel.findById(transformerId);
        }
        if (!transformer && transformerUniqueId) {
            transformer = await TransformerModel.findOne({ uniqueId: transformerUniqueId });
        }
        if (!transformer && typeof transformerId === 'string') {
            transformer = await TransformerModel.findOne({ uniqueId: transformerId });
        }

        if (!transformer) {
            return res.status(404).json({ success: false, message: "Transformer not found" });
        }

        const validTransformerId = transformer._id;
        const validTransformerUniqueId = transformer.uniqueId;

        // 2. Resolve Order safely
        let order = null;
        if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
            order = await OrderModel.findById(orderId);
        }
        if (!order && jobNumber) {
            order = await OrderModel.findOne({ jobId: jobNumber });
        }
        if (!order && transformer.orderId) {
            order = await OrderModel.findById(transformer.orderId);
        }

        const validOrderId = order ? order._id : (orderId && mongoose.Types.ObjectId.isValid(orderId) ? orderId : transformer.orderId);

        if (!validOrderId) {
            return res.status(400).json({ success: false, message: "Invalid or missing orderId for transformer" });
        }

        let normalizedStage = "SECONDARY_TESTING";
        if (stage) {
            const upper = String(stage).toUpperCase();
            if (upper === 'PRIMARY' || upper === 'PRIMARY_TESTING') normalizedStage = 'PRIMARY_TESTING';
            else if (upper === 'FINAL' || upper === 'FINAL_TESTING') normalizedStage = 'FINAL_TESTING';
            else if (upper === 'SECONDARY' || upper === 'SECONDARY_TESTING') normalizedStage = 'SECONDARY_TESTING';
            else if (upper.includes('PT_PRETEST')) normalizedStage = 'PT_PRETEST_TESTING';
            else if (upper.includes('PT')) normalizedStage = 'PT_TESTING';
            else if (upper.includes('FIELD')) normalizedStage = 'FIELD_RETURN';
            else normalizedStage = 'SECONDARY_TESTING';
        }

        let normalizedStatus = "FAILED";
        if (status) {
            const upperStatus = String(status).toUpperCase();
            const validStatuses = ["FAILED", "REPLACED", "SCRAPPED", "UNDER_ANALYSIS", "RETURNED", "TREATING", "RETESTED", "TREATED", "RESOLVED"];
            if (validStatuses.includes(upperStatus)) {
              normalizedStatus = upperStatus;
            }
        }

        // Update the Transformer's stage to secondary_failed (or pt_failed / pt_pretest_failed)
        transformer.currentStage = normalizedStage === 'PT_PRETEST_TESTING' ? "pt_pretest_failed" : normalizedStage === 'PT_TESTING' ? "pt_failed" : "secondary_failed";
        await transformer.save();

        // 3. Find any existing failure record for this transformer (guarantee single document per transformer)
        let existingFailure = await FailedTransformerModel.findOne({
            $or: [
                { transformerId: validTransformerId },
                { transformerUniqueId: validTransformerUniqueId }
            ]
        });

        if (existingFailure) {
            // Combine failure reasons for all failed cores
            const existingReasons = existingFailure.failureReason ? existingFailure.failureReason.split(' | ') : [];
            const newReasons = failureReason ? failureReason.split(' | ') : [];
            const combinedReasonsSet = new Set([...existingReasons, ...newReasons].filter(Boolean));
            const mergedFailureReason = Array.from(combinedReasonsSet).join(' | ');

            // Combine core types (e.g. Metering + Protection -> Multiple)
            let coreTypesSet = new Set();
            if (existingFailure.coreType) {
              existingFailure.coreType.split(/[,|]/).forEach(t => {
                const trimmed = t.trim();
                if (trimmed) coreTypesSet.add(trimmed);
              });
            }
            if (coreType) {
              coreTypesSet.add(coreType.trim());
            }
            const coreTypesArray = Array.from(coreTypesSet);
            const mergedCoreType = coreTypesArray.length > 1 ? 'Multiple' : (coreTypesArray[0] || coreType);

            existingFailure.status = normalizedStatus;
            existingFailure.stage = normalizedStage;
            existingFailure.coreType = mergedCoreType;
            existingFailure.failureReason = mergedFailureReason;

            if (remark !== undefined && String(remark).trim() !== '') {
              const trimmedRemark = String(remark).trim();
              if (existingFailure.remark && existingFailure.remark.trim() !== '') {
                const existingRemarks = existingFailure.remark.split(' | ');
                if (!existingRemarks.includes(trimmedRemark)) {
                  existingFailure.remark = `${existingFailure.remark} | ${trimmedRemark}`;
                }
              } else {
                existingFailure.remark = trimmedRemark;
              }
            }

            existingFailure.failureParameters = {
              ...(existingFailure.failureParameters || {}),
              ...(failureParameters || {})
            };
            existingFailure.reportedBy = reportedBy;
            existingFailure.testType = testType || `Secondary ${mergedCoreType}`;
            existingFailure.jobNumber = jobNumber || transformer.jobId || (order ? order.jobId : '');
            existingFailure.clientName = clientName || transformer.clientName || (order ? order.clientName : '');
            existingFailure.transformerUniqueId = validTransformerUniqueId;
            existingFailure.orderId = validOrderId;
            existingFailure.date = Date.now();
            
            // Clear treatment details since it is now failing again
            existingFailure.treatedBy = undefined;
            existingFailure.treatedAt = undefined;
            existingFailure.resolutionRemarks = undefined;

            await existingFailure.save();

            return res.status(200).json({
                success: true,
                message: "Failed transformer updated successfully with combined failure reasons",
                data: existingFailure
            });
        }

        const failedRecord = new FailedTransformerModel({
            transformerId: validTransformerId,
            transformerUniqueId: validTransformerUniqueId,
            orderId: validOrderId,
            jobNumber: jobNumber || transformer.jobId || (order ? order.jobId : ''),
            clientName: clientName || transformer.clientName || (order ? order.clientName : ''),
            coreType,
            testType: testType || `Secondary ${coreType}`,
            failureParameters,
            failureReason,
            remark,
            reportedBy,
            stage: normalizedStage,
            status: normalizedStatus
        });

        await failedRecord.save();

        res.status(201).json({
            success: true,
            message: "Failed transformer logged successfully",
            data: failedRecord
        });

    } catch (error) {
        console.error("Error creating failed transformer record:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});

// GET /api/failed-transformers
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const { reportedBy, stage, status, search } = req.query;
        const query = {};

        if (reportedBy) {
            query.reportedBy = reportedBy;
        }
        if (stage) {
            if (stage.includes(',')) {
                query.stage = { $in: stage.split(',') };
            } else {
                query.stage = stage;
            }
        }
        if (status) {
            query.status = status;
        }

        // Non-admin users only see failed transformers reported by them, EXCEPT for SECONDARY_TESTING/PRIMARY_TESTING/FINAL_TESTING/PT_PRETEST_TESTING/PT_TESTING stages where they see all failures
        const user = req.user;
        const isAdmin = user.role === 'admin' || user.designation === 'Admin' || ['Management', 'Office', 'Admin'].includes(user.department);
        const isExcludedStage = stage && (
            stage.includes("SECONDARY_TESTING") || 
            stage.includes("PRIMARY_TESTING") || 
            stage.includes("FINAL_TESTING") ||
            stage.includes("PT_PRETEST_TESTING") ||
            stage.includes("PT_TESTING")
        );
        if (!isAdmin && !isExcludedStage) {
            const namesToCheck = [user.name, user.fullName].filter(Boolean);
            query.reportedBy = { $in: namesToCheck };
        }

        if (search) {
            const searchRegex = new RegExp(escapeRegExp(search), 'i');
            query.$or = [
                { transformerUniqueId: searchRegex },
                { jobNumber: searchRegex },
                { clientName: searchRegex },
                { failureReason: searchRegex }
            ];
        }

        const list = await FailedTransformerModel.find(query)
            .populate('transformerId')
            .populate('orderId')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: list
        });
    } catch (error) {
        console.error("Error fetching failed transformers:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});

// GET /api/failed-transformers/count
router.get('/count', isAuthenticated, async (req, res) => {
    try {
        const { stage } = req.query;
        let stageFilter;

        if (stage) {
            // Support comma-separated stage values
            stageFilter = stage.includes(',') ? { $in: stage.split(',') } : stage;
        } else {
            // Default: CT stages
            stageFilter = { $in: ["SECONDARY_TESTING", "PRIMARY_TESTING", "FINAL_TESTING"] };
        }

        const query = {
            stage: stageFilter,
            status: "FAILED"
        };
        
        const count = await FailedTransformerModel.countDocuments(query);
        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        console.error("Error counting failed transformers:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});

// GET /api/failed-transformers/:id
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const record = await FailedTransformerModel.findById(req.params.id)
            .populate('transformerId')
            .populate('orderId')
            .lean();

        if (!record) {
            return res.status(404).json({ success: false, message: "Failed transformer record not found" });
        }

        res.status(200).json({
            success: true,
            data: record
        });
    } catch (error) {
        console.error("Error fetching failed transformer:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});

// PUT /api/failed-transformers/:id/retest-save
router.put('/:id/retest-save', isAuthenticated, async (req, res) => {
    try {
        const { treatedReadings, treatedBy, remarks, coreType } = req.body;
        
        const record = await FailedTransformerModel.findById(req.params.id);
        if (!record) {
            return res.status(404).json({ success: false, message: "Failed transformer record not found" });
        }

        const transformer = await TransformerModel.findById(record.transformerId);
        if (!transformer) {
            return res.status(404).json({ success: false, message: "Transformer not found" });
        }

        // 1. Save treated readings into the correct test history stage (ALWAYS secondary_test)
        if (!transformer.testHistory.secondary_test) {
            transformer.testHistory.secondary_test = {};
        }

        const coreTypeLower = (coreType || record.coreType || '').toLowerCase(); // 'metering', 'ps', 'protection 1' etc
        const testTypeLower = (record.testType || '').toLowerCase();
        
        // This handles merging the edited readings into the corresponding history stage.
        // We figure out the target field from the failed record's testType or coreType
        if (Array.isArray(treatedReadings)) {
            let coreSlot = "";
            if (treatedReadings.length > 0) {
                coreSlot = treatedReadings[0].internalCoreNo || treatedReadings[0].coreId;
            }
            if (!coreSlot && record.failureParameters) {
                coreSlot = record.failureParameters.coreId || record.failureParameters.internalCoreNo;
            }
            if (!coreSlot && record.failureParameters && record.failureParameters.length > 0) {
                coreSlot = record.failureParameters[0].internalCoreNo || record.failureParameters[0].coreId;
            }
            if (!coreSlot) {
                coreSlot = "1";
            }

            const formattedReadings = treatedReadings.map(r => {
                const targetId = r.internalCoreNo || r.coreId || coreSlot;
                return { ...r, internalCoreNo: targetId, coreId: targetId };
            });

            const updateStageHistory = (stageName, resultField) => {
                if (!transformer.testHistory[stageName]) transformer.testHistory[stageName] = {};
                if (!transformer.testHistory[stageName][resultField]) transformer.testHistory[stageName][resultField] = [];
                const existingResults = transformer.testHistory[stageName][resultField] || [];
                const isSlotMatch = (r) => {
                    const id = String(r.internalCoreNo || r.coreId || '').trim();
                    const target = String(coreSlot || '').trim();
                    return id === target || id.endsWith(target) || target.endsWith(id);
                };
                const firstIdx = existingResults.findIndex(isSlotMatch);
                const otherCoresResults = existingResults.filter(r => !isSlotMatch(r));
                if (firstIdx !== -1) {
                    otherCoresResults.splice(firstIdx, 0, ...formattedReadings);
                    transformer.testHistory[stageName][resultField] = otherCoresResults;
                } else {
                    transformer.testHistory[stageName][resultField] = [...otherCoresResults, ...formattedReadings];
                }
            };

            if (coreTypeLower.includes('meter') || (!coreType && testTypeLower.includes('meter'))) {
                ['secondary_test', 'primary_test', 'final_test'].forEach(stg => updateStageHistory(stg, 'metering_results'));
            } else if (coreTypeLower.includes('ps') || (!coreType && testTypeLower.includes('ps'))) {
                ['secondary_test', 'primary_test', 'final_test'].forEach(stg => updateStageHistory(stg, 'ps_results'));
            } else if (coreTypeLower.includes('protect') || (!coreType && testTypeLower.includes('protect'))) {
                ['secondary_test', 'primary_test', 'final_test'].forEach(stg => updateStageHistory(stg, 'protection_results'));
            }
        }

        transformer.testHistory.secondary_test.tester = treatedBy || record.treatedBy || 'System';
        transformer.testHistory.secondary_test.status = "Completed";
        transformer.testHistory.secondary_test.timestamp = new Date();
        transformer.markModified('testHistory');

        await transformer.save();

        // 2. Add audit entry to FailedTransformer.retestHistory
        if (!record.retestHistory) {
            record.retestHistory = [];
        }
        
        record.retestHistory.push({
            oldPrimaryFailedReadings: record.failureParameters,
            newTreatmentReadings: treatedReadings,
            treatedBy: treatedBy || 'System',
            treatedAt: new Date(),
            remarks: remarks || "Treated After Primary Failure"
        });

        // 3. Keep record status as FAILED until explicit Approve or Strict Approve is clicked
        record.treatedBy = treatedBy || 'System';
        record.treatedAt = new Date();
        if (remarks) {
            record.resolutionRemarks = remarks;
        }

        await record.save();

        res.status(200).json({
            success: true,
            message: "Retest saved successfully",
            data: record
        });

    } catch (error) {
        console.error("Error saving retest data:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});

// PUT /api/failed-transformers/:id/status
router.put('/:id/status', isAuthenticated, async (req, res) => {
    try {
        const { status, treatedBy, resolutionRemarks } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: "Missing status field" });
        }

        const record = await FailedTransformerModel.findById(req.params.id);
        if (!record) {
            return res.status(404).json({ success: false, message: "Failed transformer record not found" });
        }

        record.status = status;
        
        // Track who treated it and when
        if (treatedBy) {
            record.treatedBy = treatedBy;
            record.treatedAt = new Date();
        }
        if (resolutionRemarks !== undefined) {
            record.resolutionRemarks = resolutionRemarks;
        }

        await record.save();

        // If the status is TREATED or RETESTED or RESOLVED, return the Transformer to Primary stage for fresh retesting
        if (status === "TREATED" || status === "RETESTED" || status === "RESOLVED") {
            const transformer = await TransformerModel.findById(record.transformerId);
            if (transformer) {
                // Regardless of which stage the transformer failed in (PRIMARY_TESTING, SECONDARY_TESTING, or FINAL_TESTING),
                // after the failed core is treated/replaced and retested:
                //   - Secondary test values (the retest results) are KEPT as the latest valid passing values
                //   - Primary test data is CLEARED so primary testing starts fresh on all cores
                //   - Final test data is CLEARED so final testing starts fresh on all cores
                //   - Transformer moves to 'primary' stage for a complete fresh primary + final test cycle
                
                transformer.currentStage = 'primary';

                // Clear primary test history for fresh retesting
                transformer.testHistory.primary_test = {
                    metering_results: [],
                    ps_results: [],
                    protection_results: [],
                    tester: null,
                    status: 'Pending',
                    timestamp: null
                };

                // Clear final test history for fresh retesting
                transformer.testHistory.final_test = {
                    metering_results: [],
                    ps_results: [],
                    protection_results: [],
                    status: 'Pending',
                    tester: null,
                    timestamp: null,
                    // Clear all comprehensive final test fields too
                    polarityResult: null,
                    meggarPrimaryToSecondary: null,
                    meggarPrimaryToEarth: null,
                    meggarSecondaryToEarth: null,
                    meggarCoreToCore: null,
                    hvSecondaryWinding: null,
                    hvPrimaryWinding: null,
                    hvBetweenCore: null,
                    ovitTest: null,
                    reportDate: null
                };

                // NOTE: secondary_test data is intentionally preserved — it holds the latest
                // passing retest values which are now the canonical secondary test results.

                // Mark reserved ready stock cores for this order as used
                try {
                    const ReadyTransformerModel = require('../models/ReadyTransformerModel');
                    await ReadyTransformerModel.updateMany(
                        { linkedOrderId: record.orderId, status: "reserved" },
                        { $set: { status: "used" } }
                    );
                    if (global.io) global.io.emit("readyStockUpdated");
                } catch (stockErr) {
                    console.warn("Could not update ready stock to used upon treatment:", stockErr);
                }

                transformer.markModified('testHistory');
                await transformer.save();

                // Update parent Order currentStage to 'primary' as well so it appears on Primary Panel
                if (transformer.orderId) {
                    const { OrderModel } = require('../models/OrderModel');
                    const order = await OrderModel.findById(transformer.orderId);
                    if (order) {
                        order.currentStage = 'primary';
                        await order.save();
                    }
                }
            }
        }

        res.status(200).json({
            success: true,
            message: `Status updated to ${status} successfully.`,
            data: record
        });
    } catch (error) {
        console.error("Error updating failed transformer status:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});

// PUT /api/failed-transformers/:id/replace-core
router.put('/:id/replace-core', isAuthenticated, async (req, res) => {
    try {
        const { coreNumber, coreType, oldCoreId, newCoreId, treatedBy } = req.body;

        if (!coreNumber || !coreType || !newCoreId) {
            return res.status(400).json({ success: false, message: "Missing required fields: coreNumber, coreType, newCoreId" });
        }

        const failedRecord = await FailedTransformerModel.findById(req.params.id);
        if (!failedRecord) {
            return res.status(404).json({ success: false, message: "Failed transformer record not found" });
        }

        const transformer = await TransformerModel.findById(failedRecord.transformerId);
        if (!transformer) {
            return res.status(404).json({ success: false, message: "Transformer not found" });
        }

        // Locate secondary test results for this core
        // Results are stored in transformer.testHistory.secondary_test.[coreType]_results
        const typeKey = `${coreType.toLowerCase()}_results`;
        const secondaryHistory = transformer.testHistory?.secondary_test;
        if (!secondaryHistory) {
            return res.status(400).json({ success: false, message: "Transformer does not have secondary test history" });
        }

        if (!secondaryHistory[typeKey]) {
            secondaryHistory[typeKey] = [];
        }

        const resultsList = secondaryHistory[typeKey];

        // Find result block matching oldCoreId, or fallback to matching index based on coreNumber.
        let matchingIndex = -1;
        if (oldCoreId) {
            matchingIndex = resultsList.findIndex(r => r.internalCoreNo === oldCoreId || r.coreId === oldCoreId);
        }

        // Fallback: if matchingIndex is still -1, let's try to match by order sequence or create a new one.
        if (matchingIndex === -1) {
            const order = await OrderModel.findById(transformer.orderId);
            if (order && order.coreDetails) {
                let seqIndex = 0;
                let foundSeq = -1;
                for (let i = 0; i < order.coreDetails.length; i++) {
                    const c = order.coreDetails[i];
                    const tStr = (c.coreType || 'Metering').toLowerCase();
                    let matches = false;
                    if (coreType.toLowerCase() === 'ps') matches = tStr.includes('ps');
                    else if (coreType.toLowerCase() === 'protection') matches = tStr.includes('protection');
                    else matches = !tStr.includes('ps') && !tStr.includes('protection');

                    if (matches) {
                        if (i + 1 === coreNumber) {
                            foundSeq = seqIndex;
                            break;
                        }
                        seqIndex++;
                    }
                }
                if (foundSeq !== -1 && resultsList[foundSeq]) {
                    matchingIndex = foundSeq;
                }
            }
        }

        if (matchingIndex !== -1) {
            // Update the core ID and reset the test values
            const block = resultsList[matchingIndex].toObject ? resultsList[matchingIndex].toObject() : resultsList[matchingIndex];
            block.internalCoreNo = newCoreId;
            block.coreId = newCoreId;

            // Clear values based on core type
            if (coreType.toLowerCase() === 'metering') {
                if (block.rows && Array.isArray(block.rows)) {
                    block.rows.forEach(row => {
                        row.r100 = "";
                        row.p100 = "";
                        row.r25 = "";
                        row.p25 = "";
                        row.r100_r_pass = null;
                        row.r100_p_pass = null;
                        row.r100_pass = null;
                        row.r100_reason = null;
                        row.r25_r_pass = null;
                        row.r25_p_pass = null;
                        row.r25_pass = null;
                        row.r25_reason = null;
                    });
                }
            } else if (coreType.toLowerCase() === 'ps') {
                block.turnRatioError = "";
                block.resistance = "";
                block.vk = "";
                block.vkVal = "";
                block.iexVk = "";
                block.iex11Vk = "";
                block.isPass = null;
                block.reason = null;
            } else if (coreType.toLowerCase() === 'protection') {
                block.ratioError100 = 0;
                block.phaseError = 0;
                block.resistance = 0;
                block.secondaryLimitingVoltage = 0;
                block.secondaryLimitingVtg = 0;
                block.excitationCurrent = 0;
                block.compositeError = 0;
                block.alf = 0;
                block.isPass = null;
                block.reason = null;
            }
            resultsList[matchingIndex] = block;
            transformer.markModified(`testHistory.secondary_test.${typeKey}`);
        } else {
            // If no result block exists yet, create one
            const newBlock = {
                internalCoreNo: newCoreId,
                coreId: newCoreId,
                ratioValue: "N/A",
                isPass: null,
                reason: null
            };
            if (coreType.toLowerCase() === 'metering') {
                newBlock.rows = [];
            }
            resultsList.push(newBlock);
            transformer.markModified(`testHistory.secondary_test.${typeKey}`);
        }

        // Cleanse primary_test and final_test histories completely if we are returning to primary stage
        // This ensures every core starts with blank primary values, forcing a complete fresh retest.
        if (failedRecord.stage === "PRIMARY_TESTING") {
            if (transformer.testHistory && transformer.testHistory.primary_test) {
                transformer.testHistory.primary_test.metering_results = [];
                transformer.testHistory.primary_test.ps_results = [];
                transformer.testHistory.primary_test.protection_results = [];
                transformer.testHistory.primary_test.tester = null;
                transformer.testHistory.primary_test.status = 'Pending';
                transformer.testHistory.primary_test.timestamp = null;
                transformer.markModified('testHistory.primary_test');
            }
            if (transformer.testHistory && transformer.testHistory.final_test) {
                transformer.testHistory.final_test.metering_results = [];
                transformer.testHistory.final_test.ps_results = [];
                transformer.testHistory.final_test.protection_results = [];
                transformer.testHistory.final_test.status = 'Pending';
                transformer.testHistory.final_test.tester = null;
                transformer.testHistory.final_test.timestamp = null;
                transformer.markModified('testHistory.final_test');
            }
        }

        // Update Ready Stock status if this core was selected from ready stock
        try {
            const ReadyTransformerModel = require('../models/ReadyTransformerModel');
            
            // Mark old core as failed in Ready Stock
            if (oldCoreId) {
                await ReadyTransformerModel.updateMany(
                    { coreId: oldCoreId },
                    { $set: { status: "failed", failureReason: "Failed in Testing" } }
                );
            }

            // Reserve the newly selected ready core for this order
            const readyCore = await ReadyTransformerModel.findOne({ coreId: newCoreId });
            if (readyCore && readyCore.status !== 'used') {
                const userId = req.user._id;
                readyCore.status = 'reserved';
                readyCore.linkedOrderId = transformer.orderId;
                if (!readyCore.usageLogs) {
                    readyCore.usageLogs = [];
                }
                readyCore.usageLogs.push({
                    usedBy: userId,
                    usedAt: new Date(),
                    orderId: transformer.orderId,
                    failedCoreId: oldCoreId
                });
                await readyCore.save();

                // Emit update event if socket is available
                if (global.io) global.io.emit("readyStockUpdated");
            }
        } catch (stockErr) {
            console.warn("Could not reserve core in ready stock tracking backend:", stockErr);
        }

        // Update core ID pointers directly on transformer and testHistory
        const typeLower = (coreType || '').toLowerCase();
        if (!transformer.testHistory) transformer.testHistory = {};
        if (!transformer.testHistory.secondary_test) transformer.testHistory.secondary_test = {};

        if (typeLower === 'metering') {
            transformer.meteringCoreId = newCoreId;
            transformer.testHistory.secondary_test.meteringCoreId = newCoreId;
        } else if (typeLower === 'ps') {
            transformer.psCoreId = newCoreId;
            transformer.testHistory.secondary_test.psCoreId = newCoreId;
        } else if (typeLower === 'protection') {
            transformer.protectionCoreId = newCoreId;
            transformer.testHistory.secondary_test.protectionCoreId = newCoreId;
        }

        if (!transformer.retestHistory || !Array.isArray(transformer.retestHistory)) {
            transformer.retestHistory = [];
        }
        transformer.retestHistory.push({
            action: 'Core Replaced',
            coreNumber,
            coreType,
            oldCoreId,
            newCoreId,
            treatedBy: treatedBy || "Secondary Tester",
            treatedAt: new Date()
        });
        transformer.markModified('retestHistory');
        transformer.markModified('testHistory');

        // Save the updated transformer with core pointers and history updated
        await transformer.save();

        // Update Failed Transformer record details and log audit entry
        failedRecord.treatedBy = treatedBy || "Secondary Tester";
        failedRecord.treatedAt = new Date();
        failedRecord.resolutionRemarks = `Core Replaced: ${oldCoreId || 'N/A'} -> ${newCoreId}. Retest required.`;
        
        if (!failedRecord.retestHistory || !Array.isArray(failedRecord.retestHistory)) {
            failedRecord.retestHistory = [];
        }
        failedRecord.retestHistory.push({
            action: 'Core Replaced',
            coreNumber,
            coreType,
            oldCoreId,
            newCoreId,
            treatedBy: treatedBy || "Secondary Tester",
            treatedAt: new Date()
        });
        failedRecord.markModified('retestHistory');

        failedRecord.failureParameters = failedRecord.failureParameters || {};
        failedRecord.failureParameters.coreId = newCoreId;
        failedRecord.markModified('failureParameters');

        await failedRecord.save();

        // Automatically register the replaced failed core into FailedCore collection for inventory tracking
        try {
            const { FailedCoreModel } = require('../models/FailedCoreModel');
            const coreIdToRecord = (oldCoreId && oldCoreId !== 'N/A' && oldCoreId.trim() !== '')
                ? oldCoreId
                : `${failedRecord.transformerUniqueId}-Core${coreNumber}`;

            const mappedCoreType = coreType.toLowerCase().includes('ps') ? 'PS'
                : coreType.toLowerCase().includes('protect') ? 'PROTECTION'
                : 'METERING';

            const mappedFailureStage = failedRecord.stage === 'PRIMARY_TESTING' ? 'PRIMARY_TEST'
                : failedRecord.stage === 'FINAL_TESTING' ? 'FINAL_QA'
                : 'SECONDARY_TEST';

            const order = await OrderModel.findById(failedRecord.orderId);

            await FailedCoreModel.findOneAndUpdate(
                { $or: [{ internalCoreNo: coreIdToRecord }, { coreId: coreIdToRecord }] },
                {
                    orderId: failedRecord.orderId,
                    orderNumber: order ? (order.orderNumber || order.jobId) : failedRecord.jobNumber,
                    jobId: failedRecord.jobNumber || (order ? order.jobId : ''),
                    clientName: failedRecord.clientName || (order ? order.clientName : ''),
                    internalCoreNo: coreIdToRecord,
                    coreId: coreIdToRecord,
                    vendorCoreNo: coreIdToRecord,
                    coreType: mappedCoreType,
                    vendorName: order ? (order.vendorName || "SECONDARY TEST") : "SECONDARY TEST",
                    failureReason: failedRecord.failureReason || `Core ${coreNumber} replaced during ${failedRecord.stage || 'testing'} on transformer ${failedRecord.transformerUniqueId}`,
                    failureStage: mappedFailureStage,
                    status: "FAILED",
                    returnStatus: "PENDING",
                    failedAt: new Date(),
                    replacementInternalCoreNo: newCoreId
                },
                { upsert: true, new: true }
            );

            if (global.io) {
                global.io.emit("failedCoreLogged");
                global.io.emit("readyStockUpdated");
            }
        } catch (failedCoreErr) {
            console.error("Error creating FailedCore inventory entry upon core replacement:", failedCoreErr);
        }

        res.status(200).json({
            success: true,
            message: `Core replaced successfully. Transformer stage reset to ${transformer.currentStage} for re-testing.`,
            data: failedRecord
        });

    } catch (error) {
        console.error("Error in core replacement:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});

module.exports = router;

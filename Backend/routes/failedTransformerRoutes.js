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
            reportedBy,
            stage,
            status
        } = req.body;

        if (!transformerId || !orderId || !coreType || !failureReason || !reportedBy) {
            return res.status(400).json({ success: false, message: "Missing required fields: transformerId, orderId, coreType, failureReason, reportedBy" });
        }

        // Check duplicates: If failure already exists for same transformerId + coreType, update/re-log it.
        const existingFailure = await FailedTransformerModel.findOne({
            transformerId,
            coreType
        });

        // Update the Transformer's stage to secondary_failed
        const transformer = await TransformerModel.findById(transformerId);
        if (!transformer) {
            return res.status(404).json({ success: false, message: "Transformer not found" });
        }
        transformer.currentStage = "secondary_failed";
        await transformer.save();

        // Find parent Order to grab latest jobId/clientName if missing
        const order = await OrderModel.findById(orderId);

        if (existingFailure) {
            existingFailure.status = status || "FAILED";
            existingFailure.stage = stage || "SECONDARY_TESTING";
            existingFailure.failureReason = failureReason;
            existingFailure.failureParameters = failureParameters || {};
            existingFailure.reportedBy = reportedBy;
            existingFailure.testType = testType || `Secondary ${coreType}`;
            existingFailure.jobNumber = jobNumber || transformer.jobId || (order ? order.jobId : '');
            existingFailure.clientName = clientName || transformer.clientName || (order ? order.clientName : '');
            existingFailure.transformerUniqueId = transformerUniqueId || transformer.uniqueId;
            existingFailure.orderId = orderId;
            existingFailure.date = Date.now();
            
            // Clear treatment details since it is now failing again
            existingFailure.treatedBy = undefined;
            existingFailure.treatedAt = undefined;
            existingFailure.resolutionRemarks = undefined;

            await existingFailure.save();

            return res.status(200).json({
                success: true,
                message: "Failed transformer updated successfully",
                data: existingFailure
            });
        }

        const failedRecord = new FailedTransformerModel({
            transformerId,
            transformerUniqueId: transformerUniqueId || transformer.uniqueId,
            orderId,
            jobNumber: jobNumber || transformer.jobId || (order ? order.jobId : ''),
            clientName: clientName || transformer.clientName || (order ? order.clientName : ''),
            coreType,
            testType: testType || `Secondary ${coreType}`,
            failureParameters,
            failureReason,
            reportedBy,
            stage: stage || "SECONDARY_TESTING",
            status: status || "FAILED"
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

        // Non-admin users only see failed transformers reported by them, EXCEPT for SECONDARY_TESTING/PRIMARY_TESTING/FINAL_TESTING stages where they see all failures
        const user = req.user;
        const isAdmin = user.role === 'admin' || user.designation === 'Admin' || ['Management', 'Office', 'Admin'].includes(user.department);
        const isCTStage = stage && (stage.includes("SECONDARY_TESTING") || stage.includes("PRIMARY_TESTING") || stage.includes("FINAL_TESTING"));
        if (!isAdmin && !isCTStage) {
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
        const query = {
            stage: { $in: ["SECONDARY_TESTING", "PRIMARY_TESTING", "FINAL_TESTING"] },
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

            const formattedReadings = treatedReadings.map(r => ({ ...r, internalCoreNo: coreSlot, coreId: coreSlot }));

            if (coreTypeLower.includes('meter') || testTypeLower.includes('meter')) {
                if (!transformer.testHistory.secondary_test.metering_results) transformer.testHistory.secondary_test.metering_results = [];
                const existingResults = transformer.testHistory.secondary_test.metering_results || [];
                const otherCoresResults = existingResults.filter(r =>
                    r.internalCoreNo !== coreSlot && r.coreId !== coreSlot
                );
                transformer.testHistory.secondary_test.metering_results = [...otherCoresResults, ...formattedReadings];

                // Clear from primary and final
                ['primary_test', 'final_test'].forEach(stage => {
                    if (transformer.testHistory[stage] && transformer.testHistory[stage].metering_results) {
                        transformer.testHistory[stage].metering_results = transformer.testHistory[stage].metering_results.filter(r => 
                            r.internalCoreNo !== coreSlot && r.coreId !== coreSlot
                        );
                    }
                });

            } else if (coreTypeLower.includes('ps') || testTypeLower.includes('ps')) {
                if (!transformer.testHistory.secondary_test.ps_results) transformer.testHistory.secondary_test.ps_results = [];
                const existingResults = transformer.testHistory.secondary_test.ps_results || [];
                const otherCoresResults = existingResults.filter(r =>
                    r.internalCoreNo !== coreSlot && r.coreId !== coreSlot
                );
                transformer.testHistory.secondary_test.ps_results = [...otherCoresResults, ...formattedReadings];

                // Clear from primary and final
                ['primary_test', 'final_test'].forEach(stage => {
                    if (transformer.testHistory[stage] && transformer.testHistory[stage].ps_results) {
                        transformer.testHistory[stage].ps_results = transformer.testHistory[stage].ps_results.filter(r => 
                            r.internalCoreNo !== coreSlot && r.coreId !== coreSlot
                        );
                    }
                });

            } else if (coreTypeLower.includes('protection') || testTypeLower.includes('protection')) {
                if (!transformer.testHistory.secondary_test.protection_results) transformer.testHistory.secondary_test.protection_results = [];
                const existingResults = transformer.testHistory.secondary_test.protection_results || [];
                const otherCoresResults = existingResults.filter(r =>
                    r.internalCoreNo !== coreSlot && r.coreId !== coreSlot
                );
                transformer.testHistory.secondary_test.protection_results = [...otherCoresResults, ...formattedReadings];

                // Clear from primary and final
                ['primary_test', 'final_test'].forEach(stage => {
                    if (transformer.testHistory[stage] && transformer.testHistory[stage].protection_results) {
                        transformer.testHistory[stage].protection_results = transformer.testHistory[stage].protection_results.filter(r => 
                            r.internalCoreNo !== coreSlot && r.coreId !== coreSlot
                        );
                    }
                });
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

        // 3. Update status to TREATED
        record.status = "TREATED";
        record.treatedBy = treatedBy || 'System';
        record.treatedAt = new Date();
        if (remarks) {
            record.resolutionRemarks = remarks;
        }

        await record.save();

        res.status(200).json({
            success: true,
            message: "Retest saved and transformer updated to TREATED",
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

        // If the status is TREATED or RETESTED or RESOLVED, return the Transformer to correct testing stage
        if (status === "TREATED" || status === "RETESTED" || status === "RESOLVED") {
            const transformer = await TransformerModel.findById(record.transformerId);
            if (transformer) {
                transformer.currentStage = record.stage === "PRIMARY_TESTING" ? "primary" : "secondary";
                await transformer.save();
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

        // Cleanse primary_test and final_test histories by updating the old core ID to the new one in-place and clearing readings
        const cleanTestResults = (testStageKey) => {
            const stageHistory = transformer.testHistory?.[testStageKey];
            if (stageHistory && stageHistory[typeKey]) {
                const stageResults = stageHistory[typeKey];
                let idx = -1;
                if (oldCoreId) {
                    idx = stageResults.findIndex(r => r.internalCoreNo === oldCoreId || r.coreId === oldCoreId);
                }
                if (idx === -1 && matchingIndex !== -1) {
                    idx = matchingIndex;
                }
                if (idx !== -1 && stageResults[idx]) {
                    const block = stageResults[idx].toObject ? stageResults[idx].toObject() : stageResults[idx];
                    block.internalCoreNo = newCoreId;
                    block.coreId = newCoreId;
                    
                    // Clear readings/values
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
                    stageResults[idx] = block;
                    transformer.markModified(`testHistory.${testStageKey}.${typeKey}`);
                }
            }
        };
        cleanTestResults('primary_test');
        cleanTestResults('final_test');

        // Update Ready Stock status if this core was selected from ready stock
        try {
            const ReadyTransformerModel = require('../models/ReadyTransformerModel');
            const readyCore = await ReadyTransformerModel.findOne({ coreId: newCoreId });
            if (readyCore && readyCore.status !== 'used') {
                const userId = req.user._id;
                readyCore.status = 'used';
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
            console.warn("Could not reserve/use core in ready stock tracking backend:", stockErr);
        }

        // Save the updated transformer
        transformer.currentStage = failedRecord.stage === "PRIMARY_TESTING" ? "primary" : "secondary";
        await transformer.save();

        // Update Failed Transformer record
        failedRecord.status = "TREATED";
        failedRecord.treatedBy = treatedBy || "Secondary Tester";
        failedRecord.treatedAt = new Date();
        failedRecord.resolutionRemarks = `Core Replaced: ${oldCoreId || 'N/A'} -> ${newCoreId}. Retest required.`;
        
        failedRecord.failureParameters = failedRecord.failureParameters || {};
        failedRecord.failureParameters.coreId = newCoreId;
        failedRecord.markModified('failureParameters');

        await failedRecord.save();

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

const mongoose = require('mongoose');
const ReadyTransformer = require('../models/ReadyTransformerModel');
const { FailedCoreModel } = require('../models/FailedCoreModel');
const { PreTestBatchModel } = require('../models/PreTestBatchModel');
const { generateCoreIdFromBatch } = require('./idGenerator');

/**
 * Builds a query object based on whether it's a pre-test batch or a standard order.
 */
const buildTestQuery = ({ id, orderId, batchId, isPreTest, coreType }) => {
  if (isPreTest || (id && id.startsWith("BATCH-")) || batchId) {
    return { batchId: id || batchId, isPreTest: true, coreType };
  }
  return { orderId: id || orderId, coreType };
};

/**
 * Shared service to save test results and trigger automation.
 */
const saveTestResults = async ({
  Model,
  query,
  payload,
  user
}) => {
  try {
    const { 
      readings, 
      isPreTest, 
      batchId, 
      coreType, 
      vendorName, 
      vendorId, 
      testSetup, 
      testLimits, 
      testSpecification,
      orderId, // Extract to prevent accidental spread for pre-tests
      ...otherData 
    } = payload;

    // 1. Prepare Data
    const processedReadings = (readings || []).map(r => ({
      ...r,
      status: r.status || (r.result === "F" ? "FAIL" : (r.result === "P" ? "PASS" : "PENDING"))
    }));

    // Data to save/update
    const updateData = {
      ...otherData,
      testSetup,
      testLimits,
      testSpecification,
      readings: processedReadings,
      reportDate: new Date(),
      // CRITICAL: Only include orderId if it's NOT a pre-test batch
      ...(isPreTest ? { batchId, isPreTest: true } : { orderId })
    };

    // 2. UPSERT Test Record (with merging of existing readings)
    let finalReadings = processedReadings;
    try {
      const existingRecord = await Model.findOne(query).lean();
      if (existingRecord && existingRecord.readings && existingRecord.readings.length > 0) {
        const readingsMap = {};
        
        // Populate map with existing readings
        existingRecord.readings.forEach(r => {
          if (r.internalCoreNo) {
            readingsMap[r.internalCoreNo.trim().toUpperCase()] = r;
          }
        });

        // Merge new readings
        processedReadings.forEach(r => {
          if (r.internalCoreNo) {
            readingsMap[r.internalCoreNo.trim().toUpperCase()] = r;
          }
        });

        // Convert map back to array
        finalReadings = Object.values(readingsMap);
      }
    } catch (dbErr) {
      console.warn("[saveTestResults] Failed to fetch existing record for merge, saving new only:", dbErr);
    }

    updateData.readings = finalReadings;

    let testRecord = await Model.findOneAndUpdate(
      query,
      { $set: updateData },
      { upsert: true, new: true, runValidators: true }
    );

    // 3. TRIGGER AUTOMATION (If Batch)
    if (isPreTest && batchId) {
      await handlePostTestAutomation({
        readings: processedReadings,
        batchId,
        coreType,
        vendorName,
        vendorId,
        user,
        testSetup
      });
    }

    return testRecord;
  } catch (err) {
    console.error("saveTestResults Service Error:", err);
    throw err; // Rethrow to be caught by route handler
  }
};

/**
 * Handles PASS/FAIL routing and Batch status updates after testing.
 */
const handlePostTestAutomation = async ({
  readings,
  batchId,
  coreType,
  vendorName,
  vendorId,
  user,
  testSetup
}) => {
  if (!batchId) return;

  try {
    // 1. Clean existing records for this batch AND coreType to prevent duplicates
    await ReadyTransformer.deleteMany({ batchId, coreType });
    await FailedCoreModel.deleteMany({ batchId, coreType: coreType.toUpperCase() });

    const readyBulk = [];
    const failedBulk = [];

    readings.forEach((r, idx) => {
      // Logic for PASSing cores
      if (r.result === "P" || r.status === "PASS") {
        readyBulk.push({
          coreId: r.internalCoreNo || generateCoreIdFromBatch(batchId, idx + 1),
          batchId,
          coreType,
          specifications: {
            turns: testSetup?.turnsUsed?.toString() || '',
          },
          testResults: r,
          createdFrom: "PRE_TEST",
          testedBy: user._id,
          status: "available"
        });
      } 
      // Logic for FAILing cores
      else if (r.result === "F" || r.status === "FAIL") {
        failedBulk.push({
          batchId,
          vendorName: vendorName,
          vendorId: vendorId,
          coreType: coreType.toUpperCase(),
          internalCoreNo: r.internalCoreNo || `FAIL-${batchId}-${idx + 1}`,
          vendorCoreNo: r.vendorCoreNo || "N/A",
          failureReason: "RETURN_TO_VENDOR",
          failureStage: "INITIAL_TEST",
          status: "FAILED",
          returnStatus: "PENDING",
          dynamicValues: r.measuredMa || r.value || {},
          jobId: batchId,
          clientName: "PRE-TEST BATCH"
        });
      }
    });

    // 2. Bulk Insert (Only FAILED cores immediately. PASSED cores wait for Approval)
    if (failedBulk.length > 0) await FailedCoreModel.insertMany(failedBulk);

    // 3. Update Batch Analytics & Status
    const batch = await PreTestBatchModel.findOne({ batchId });
    if (batch) {
      const totalTested = readings.filter(r => r.result === 'P' || r.result === 'F').length;
      batch.passedCount = readyBulk.length;
      batch.failedCount = failedBulk.length;
      
      if (totalTested >= batch.numberOfCores) batch.status = "COMPLETED";
      else if (totalTested > 0) batch.status = "IN_PROGRESS";
      
      await batch.save();
    }

    if (global.io) global.io.emit("readyStockUpdated");

  } catch (err) {
    console.error("Automation Error:", err);
    throw err;
  }
};

module.exports = {
  buildTestQuery,
  saveTestResults,
  handlePostTestAutomation
};

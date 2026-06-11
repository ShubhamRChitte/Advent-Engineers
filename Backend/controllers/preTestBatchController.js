const { PreTestBatchModel } = require("../models/PreTestBatchModel");
const { MeteringCoreTestModel } = require("../models/MeteringCoreTestModel");
const { ProtectionCoreTestModel } = require("../models/ProtectionCoreTestModel");
const { FailedCoreModel } = require("../models/FailedCoreModel");
const ReadyTransformer = require("../models/ReadyTransformerModel");
const { generateBatchId } = require("../utils/idGenerator");

exports.createBatch = async (req, res) => {
  try {
    const { vendorName, vendorId, coreType, numberOfCores, turns } = req.body;

    // Professional Batch ID Generation
    const date = new Date();
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await PreTestBatchModel.countDocuments({
      coreType,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });


    const batchId = generateBatchId(coreType, count);

    const newBatch = await PreTestBatchModel.create({
      batchId,
      vendorName,
      vendorId,
      coreType,
      numberOfCores,
      turns,
      status: "CREATED",
      createdBy: req.user._id
    });

    res.status(201).json(newBatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBatches = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0;
    const skip = parseInt(req.query.skip) || 0;
    const search = req.query.search || '';

    if (req.query.paginated === 'true') {
      let matchStage = {};
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        matchStage.$or = [
          { batchId: searchRegex },
          { vendorName: searchRegex },
          { coreType: searchRegex }
        ];
      }

      // Aggregation to emulate frontend's activeBatches logic
      const pipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: 'readytransformers', // MongoDB collection name
            localField: 'batchId',
            foreignField: 'batchId',
            as: 'readyCores'
          }
        },
        {
          $addFields: {
            availableCoresCount: {
              $size: {
                $filter: {
                  input: '$readyCores',
                  as: 'core',
                  cond: { $eq: ['$$core.status', 'available'] }
                }
              }
            }
          }
        },
        // We project out readyCores so we don't send massive arrays over network
        { $project: { readyCores: 0 } },
        { $sort: { createdAt: -1 } },
        { $skip: skip }
      ];

      if (limit > 0) pipeline.push({ $limit: limit });

      const batches = await PreTestBatchModel.aggregate(pipeline);
      const totalCount = await PreTestBatchModel.countDocuments(matchStage);

      res.json({ success: true, data: batches, totalCount });
    } else {
      const batches = await PreTestBatchModel.find().sort({ createdAt: -1 }).lean();
      res.json(batches);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBatchById = async (req, res) => {
  try {
    const batch = await PreTestBatchModel.findOne({ batchId: req.params.batchId });
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBatchStatus = async (req, res) => {
  try {
    const { status, testSetup, testLimits, readings } = req.body;
    const updateData = { status };
    if (testSetup) updateData.testSetup = testSetup;
    if (testLimits) updateData.testLimits = testLimits;
    if (readings) updateData.readings = readings;

    const batch = await PreTestBatchModel.findOneAndUpdate(
      { batchId: req.params.batchId },
      updateData,
      { new: true }
    );
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.saveBatchReading = async (req, res) => {
  const { reading, testSetup, testLimits } = req.body;
  const { batchId } = req.params;

  // Helper: determine if a reading is "empty" (all values cleared by user)
  const isEmptyReading = (r) => {
    // If it has a result (P/F/REPLACED), it is NOT empty
    if (r.result && r.result !== '') return false;

    // Check measuredMa (for Metering/Protection/PS cores)
    let hasMeasuredData = false;
    if (Array.isArray(r.measuredMa)) {
      hasMeasuredData = r.measuredMa.some(v => v !== null && v !== undefined && v !== '');
    }

    // Check single value
    const hasSingleValue = r.value !== null && r.value !== undefined && r.value !== '';

    // It is only empty if it has NO measured data AND NO single value
    return !hasMeasuredData && !hasSingleValue;
  };

  let retries = 3;
  while (retries > 0) {
    try {
      const batch = await PreTestBatchModel.findOne({ batchId });
      if (!batch) return res.status(404).json({ message: "Batch not found" });

      // Update status to IN_PROGRESS if it was CREATED or CONFIGURED
      if (["CREATED", "CONFIGURED"].includes(batch.status)) {
        batch.status = "IN_PROGRESS";
      }

      if (testSetup) batch.testSetup = testSetup;
      if (testLimits) batch.testLimits = testLimits;

      // Find if reading already exists (by internalCoreNo)
      const existingIndex = batch.readings.findIndex(r => r.internalCoreNo === reading.internalCoreNo);

      if (isEmptyReading(reading)) {
        // If the row was cleared, REMOVE it from readings so it doesn't persist stale 'F' result
        if (existingIndex > -1) {
          batch.readings.splice(existingIndex, 1);
        }
        // No need to add it back — skeleton rows are re-created on load
      } else {
        if (existingIndex > -1) {
          batch.readings[existingIndex] = reading;
        } else {
          batch.readings.push(reading);
        }
      }

      // Recalculate passed and failed counts — ONLY use result field, never status
      // This prevents the -1 passedCount bug caused by double-counting via status field
      // Replacement cores (PRE_TESTED) are also counted as Passed
      batch.passedCount = batch.readings.filter(r => 
        r.result === 'P' || r.result === 'PRE_TESTED' || r.result === 'PRE TESTED'
      ).length;
      
      const currentlyFailed = batch.readings.filter(r => r.result === 'F').length;
      batch.failedCount = (batch.discardedCount || 0) + currentlyFailed;

      batch.markModified('readings');
      batch.markModified('testSetup');
      batch.markModified('testLimits');

      await batch.save();
      return res.json(batch);
    } catch (error) {
      if (error.name === 'VersionError' && retries > 1) {
        console.warn(`Version conflict for batch ${batchId}, retrying... (${retries - 1} left)`);
        retries--;
        // Small delay to allow other process to finish
        await new Promise(resolve => setTimeout(resolve, 50));
        continue;
      }
      console.error("Save Batch Reading Error:", error);
      return res.status(500).json({ message: error.message });
    }
  }
};

exports.discardCore = async (req, res) => {
  try {
    const { internalCoreNo, vendorCoreNo, reason } = req.body;
    const { batchId } = req.params;

    // 1. Find the batch to get its current data
    const batch = await PreTestBatchModel.findOne({ batchId });
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    // 2. Create Failed Core record (upsert = idempotent, safe on page refresh/retry)
    await FailedCoreModel.findOneAndUpdate(
      { batchId: batch.batchId, internalCoreNo },
      {
        $setOnInsert: {
          batchId: batch.batchId,
          internalCoreNo,
          vendorCoreNo: vendorCoreNo || "N/A",
          coreType: batch.coreType.toUpperCase() === "PS" ? "SPECIAL" : batch.coreType.toUpperCase(),
          vendorId: batch.vendorId,
          vendorName: batch.vendorName,
          failureReason: reason || "Discarded during Pre-Test",
          failureStage: "INITIAL_TEST",
          status: "FAILED",
          dynamicValues: req.body.dynamicValues || {}
        }
      },
      { upsert: true, new: true }
    );

    // 3. Atomic update of the batch
    // Remove from readings, decrement total cores, increment discarded count
    const updatedBatch = await PreTestBatchModel.findOneAndUpdate(
      { batchId },
      { 
        $pull: { readings: { internalCoreNo: internalCoreNo } },
        $addToSet: { discardedCoreIds: internalCoreNo }, // Permanently log the ID
        $inc: { 
          numberOfCores: req.body.isReplacement ? 0 : -1,
          discardedCount: 1
        }
      },
      { new: true }
    );

    // 4. Recalculate passed and failed counts based on the updated state
    const currentlyFailed = updatedBatch.readings.filter(r => r.result === 'F').length;
    updatedBatch.passedCount = updatedBatch.readings.filter(r => 
      r.result === 'P' || r.result === 'PRE_TESTED' || r.result === 'PRE TESTED'
    ).length;
    updatedBatch.failedCount = (updatedBatch.discardedCount || 0) + currentlyFailed;

    await updatedBatch.save(); // This save is now safer as it happens on a fresh document and the most intensive part (pull/inc) was atomic.

    res.json({ message: "Core discarded and moved to Failed Section", batch: updatedBatch });
  } catch (error) {
    console.error("Discard Core Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.approveBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = await PreTestBatchModel.findOne({ batchId });

    if (!batch) return res.status(404).json({ message: "Batch not found" });

    if (batch.readings.length < batch.numberOfCores) {
      return res.status(400).json({ message: "All cores must be tested before approval." });
    }

    const allPassed = batch.readings.every(r => 
      r.result === 'P' || r.result === 'PRE_TESTED' || r.result === 'PRE TESTED'
    );
    if (!allPassed) {
      return res.status(400).json({ message: "All remaining cores must have 'Pass' status. Discard failed cores first." });
    }

    // Move to Ready Stock
    const readyStockEntries = batch.readings.map(r => {
      if (!r || !r.internalCoreNo) {
        console.warn("Found invalid reading in batch approval:", r);
        return null;
      }
      
      return {
        coreId: r.internalCoreNo,
        batchId: batch.batchId,
        coreType: batch.coreType,
        createdFrom: "PRE_TEST",
        status: 'available',
        specifications: {
          turns: batch.turns || "N/A",
          ratio: (batch.testSetup && batch.testSetup.ratio) || "N/A",
          burden: (batch.testSetup && batch.testSetup.burden) || "N/A",
          class: (batch.testSetup && batch.testSetup.classType) || "N/A"
        },
        testResults: r,
        testedAt: new Date()
      };
    }).filter(entry => entry !== null);

    console.log(`Approving batch ${batchId} with ${readyStockEntries.length} valid entries`);
    try {
      if (readyStockEntries.length > 0) {
        await ReadyTransformer.insertMany(readyStockEntries, { ordered: false });
      }
    } catch (insertError) {
      // If some inserted successfully but others failed (e.g. duplicates), we continue
      console.error("Some cores might have failed insertion (likely duplicates):", insertError.message);
      if (!insertError.message.includes('E11000')) {
        throw insertError;
      }
    }

    // Use findOneAndUpdate for the final status change to avoid VersionError.
    // (A concurrent save-reading call may have bumped __v between our findOne and save.)
    const finalBatch = await PreTestBatchModel.findOneAndUpdate(
      { batchId },
      { $set: { status: "COMPLETED", passedCount: batch.readings.length } },
      { new: true }
    );

    if (global.io) global.io.emit("readyStockUpdated");

    res.json({ message: "Batch approved and moved to Ready Stock", batch: finalBatch });
  } catch (error) {
    console.error("Approve Batch Error:", error);
    res.status(500).json({ 
      message: error.message, 
      stack: error.stack,
      batchId: req.params.batchId
    });
  }
};

exports.deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = await PreTestBatchModel.findOne({ batchId });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    if (batch.status === "COMPLETED") {
      return res.status(400).json({ message: "Completed batches cannot be deleted." });
    }

    await PreTestBatchModel.findOneAndDelete({ batchId });
    res.json({ message: "Batch deleted successfully", batchId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

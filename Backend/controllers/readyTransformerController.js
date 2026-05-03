
const ReadyTransformer = require("../models/ReadyTransformerModel");
const { PreTestBatchModel } = require("../models/PreTestBatchModel");
const { FailedCoreModel } = require("../models/FailedCoreModel");

exports.addReadyTransformer = async (req, res) => {
  try {
    const { coreId, coreType, specifications, testResults } = req.body;

    const newCore = await ReadyTransformer.create({
      coreId,
      batchId: `MANUAL-${Date.now()}`,
      coreType,
      specifications,
      testResults,
      createdFrom: "MANUAL",
      testedBy: req.user._id
    });

    if (global.io) global.io.emit("readyStockUpdated");
    res.status(201).json(newCore);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.batchAddReadyTransformers = async (req, res) => {
  try {
    const { batchId, coreType, turns, readings, testSetup, testLimits, testSpecification, vendorName } = req.body;
    const userId = req.user._id;

    if (!readings || !Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ message: "No readings provided" });
    }

    // Find the batch to verify it exists
    const batch = await PreTestBatchModel.findOne({ batchId });
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Validation: All cores must be tested
    const untested = readings.find(r => !r.result || (r.result !== 'P' && r.result !== 'F'));
    if (untested) {
      return res.status(400).json({ message: "All cores must be tested before submission" });
    }

    // 1. Process PASS Cores -> ReadyTransformer
    const passingReadings = readings.filter(r => r.result === 'P');
    const { generateCoreIdFromBatch } = require('../utils/idGenerator');
    const coresToInsert = passingReadings.map((reading, idx) => ({
      coreId: reading.internalCoreNo || generateCoreIdFromBatch(batchId, idx + 1),
      batchId,
      coreType,
      specifications: {
        turns,
        ratio: testSetup?.ratio || '', // Extract from setup if provided
        burden: testSetup?.burden || '',
        class: testSetup?.class || ''
      },
      testResults: reading,
      createdFrom: "PRE_TEST",
      testedBy: userId,
      status: "available"
    }));

    if (coresToInsert.length > 0) {
      await ReadyTransformer.insertMany(coresToInsert);
    }

    // 2. Process FAIL Cores -> FailedCores
    const failingReadings = readings.filter(r => r.result === 'F');
    const failedCoresToInsert = failingReadings.map(reading => ({
      batchId,
      vendorName: vendorName || batch.vendorName,
      coreType: coreType.toUpperCase(),
      internalCoreNo: reading.internalCoreNo || `FAIL-${Date.now()}`,
      vendorCoreNo: reading.vendorCoreNo || "N/A",
      failureReason: "RETURN_TO_VENDOR",
      failureStage: "INITIAL_TEST",
      status: "FAILED",
      returnStatus: "PENDING",
      dynamicValues: reading.measuredMa || reading.dynamicValues || {},
      // Snapshots for audit
      jobId: batchId,
      clientName: "PRE-TEST BATCH"
    }));

    if (failedCoresToInsert.length > 0) {
      await FailedCoreModel.insertMany(failedCoresToInsert);
    }

    // 3. Update Batch Status
    batch.status = "COMPLETED";
    await batch.save();

    if (global.io) global.io.emit("readyStockUpdated");

    res.status(201).json({
      message: "Batch testing completed and processed",
      batchId,
      passedCount: coresToInsert.length,
      failedCount: failedCoresToInsert.length
    });
  } catch (err) {
    console.error("Batch Add Error:", err);
    res.status(500).json({ message: err.message });
  }
};



exports.getAllReadyTransformers = async (req, res) => {
  try {
    const data = await ReadyTransformer.find().sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAvailableReadyTransformers = async (req, res) => {
  try {
    const { ratio, burden, classType, coreType } = req.query;

    const query = { status: "available" };
    if (ratio) query["specifications.ratio"] = ratio;
    if (burden) query["specifications.burden"] = burden;
    if (classType) query["specifications.class"] = classType;
    if (coreType) query.coreType = coreType;

    const cores = await ReadyTransformer.find(query);
    res.json(cores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reserveReadyTransformer = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user._id) {
      console.error("Reserve failed: No user found in request");
      return res.status(401).json({ message: "Authentication required for reservation" });
    }
    
    const userId = req.user._id;

    const core = await ReadyTransformer.findById(id);

    if (!core) {
      console.error(`Reserve failed: Core ${id} not found`);
      return res.status(404).json({ message: "Core not found" });
    }

    if (core.status !== "available") {
      console.error(`Reserve failed: Core ${id} status is ${core.status}`);
      return res.status(400).json({ message: "Core not available or already reserved" });
    }

    core.status = "reserved";
    core.reservedBy = userId;
    core.reservationExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await core.save();

    if (global.io) global.io.emit("readyStockUpdated");
    res.json({ message: "Core reserved successfully", core });
  } catch (err) {
    console.error("Reserve error detail:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.useReadyTransformer = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderId, replacedCoreId } = req.body;
    const userId = req.user._id;

    const core = await ReadyTransformer.findById(id);

    if (!core) {
      return res.status(404).json({ message: "Core not found" });
    }

    if (core.status !== "reserved" || (core.reservedBy && core.reservedBy.toString() !== userId.toString())) {
      return res.status(400).json({ message: "Core not reserved by you or reservation expired" });
    }

    core.status = "used";
    core.usageLogs.push({
      usedBy: userId,
      usedAt: new Date(),
      orderId,
      failedCoreId: replacedCoreId
    });

    await core.save();

    // Update PreTestBatch counter and remove reading if this core belongs to a batch
    if (core.batchId && typeof core.batchId === 'string' && !core.batchId.startsWith("MANUAL-")) {
      await PreTestBatchModel.findOneAndUpdate(
        { batchId: core.batchId },
        { 
          $inc: { 
            passedCount: -1,
            numberOfCores: -1 
          },
          $pull: { readings: { internalCoreNo: core.coreId } }
        }
      );
    }

    if (global.io) global.io.emit("readyStockUpdated");
    res.json({ message: "Core assigned successfully", transformer: core });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReadyStockAnalytics = async (req, res) => {
  try {
    const total = await ReadyTransformer.countDocuments();
    const available = await ReadyTransformer.countDocuments({ status: "available" });
    const used = await ReadyTransformer.countDocuments({ status: "used" });
    const reserved = await ReadyTransformer.countDocuments({ status: "reserved" });

    const usageRate = total > 0 ? (used / total) * 100 : 0;

    res.json({
      total,
      available,
      used,
      reserved,
      usageRate
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

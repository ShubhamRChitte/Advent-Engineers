const ReadyTransformer = require("../models/ReadyTransformerModel");
const { PreTestBatchModel } = require("../models/PreTestBatchModel");
const { FailedCoreModel } = require("../models/FailedCoreModel");
const { escapeRegExp } = require("../utils/regexHelper");

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
    let batch = await PreTestBatchModel.findOne({ batchId });
    if (!batch) {
      if (batchId && (batchId.startsWith('REUSE-') || batchId.startsWith('INDIVIDUAL-'))) {
        batch = await PreTestBatchModel.create({
          batchId,
          coreType: coreType || 'Metering',
          vendorName: vendorName || 'REUSED CORE',
          numberOfCores: readings.length,
          turns: turns || '10',
          status: 'COMPLETED'
        });
      } else {
        return res.status(404).json({ message: "Batch not found" });
      }
    }

    // Validation: All cores must be tested
    const untested = readings.find(r => !r.result || (r.result !== 'P' && r.result !== 'F'));
    if (untested) {
      return res.status(400).json({ message: "All cores must be tested before submission" });
    }

    // 1. Process PASS Cores -> ReadyTransformer
    const passingReadings = readings.filter(r => r.result === 'P');
    const { generateMultipleCoreIdsFromBatch } = require('../utils/idGenerator');
    const globalCoreIds = await generateMultipleCoreIdsFromBatch(batchId, passingReadings.length);
    
    for (let idx = 0; idx < passingReadings.length; idx++) {
      const reading = passingReadings[idx];
      const targetCoreId = reading.internalCoreNo || globalCoreIds[idx];
      
      await ReadyTransformer.findOneAndUpdate(
        { coreId: targetCoreId },
        {
          coreId: targetCoreId,
          batchId,
          coreType,
          specifications: {
            turns,
            ratio: testSetup?.ratio || '',
            burden: testSetup?.burden || '',
            class: testSetup?.class || ''
          },
          testResults: reading,
          createdFrom: batchId.startsWith('REUSE') ? "REUSE" : "PRE_TEST",
          testedBy: userId,
          status: "available"
        },
        { upsert: true, new: true }
      );
    }

    // 2. Process FAIL Cores -> FailedCores
    const failingReadings = readings.filter(r => r.result === 'F');
    for (const reading of failingReadings) {
      const targetCoreId = reading.internalCoreNo || `FAIL-${Date.now()}`;
      
      // Delete from ReadyTransformer if it was pending
      await ReadyTransformer.deleteOne({ coreId: targetCoreId });

      await FailedCoreModel.findOneAndUpdate(
        { internalCoreNo: targetCoreId },
        {
          batchId,
          vendorName: vendorName || (batch ? batch.vendorName : "REUSED CORE"),
          coreType: (coreType || 'METERING').toUpperCase(),
          internalCoreNo: targetCoreId,
          vendorCoreNo: reading.vendorCoreNo || "N/A",
          failureReason: reading.remarkReason || "RETURN_TO_VENDOR",
          failureStage: "INITIAL_TEST",
          status: "FAILED",
          returnStatus: "PENDING",
          dynamicValues: reading.measuredMa || reading.dynamicValues || {},
          jobId: batchId,
          clientName: "RETEST BATCH"
        },
        { upsert: true, new: true }
      );
    }

    // 3. Update Batch Status ONLY if all cores in batch are fully tested
    const totalTested = (batch.passedCount || 0) + (batch.failedCount || 0) + (batch.discardedCount || 0) + passingReadings.length + failingReadings.length;
    if (totalTested >= (batch.numberOfCores || 0) && (batch.numberOfCores || 0) > 0) {
      batch.status = "COMPLETED";
    } else {
      batch.status = "IN_PROGRESS";
    }
    await batch.save();

    if (global.io) {
      global.io.emit("readyStockUpdated");
      global.io.emit("failedCoreLogged");
    }

    res.status(201).json({
      message: "Batch testing completed and processed",
      batchId,
      passedCount: passingReadings.length,
      failedCount: failingReadings.length
    });
  } catch (err) {
    console.error("Batch Add Error:", err);
    res.status(500).json({ message: err.message });
  }
};



exports.getAllReadyTransformers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0;
    const skip = parseInt(req.query.skip) || 0;
    const { search, coreType } = req.query;

    if (req.query.paginated === 'true') {
      let query = {};
      
      if (coreType && coreType !== 'All') {
        query.coreType = coreType;
      }
      if (req.query.createdFrom) {
        query.createdFrom = req.query.createdFrom;
      }
      if (req.query.status === 'history') {
        query.status = { $in: ['used', 'reserved'] };
      } else if (req.query.status) {
        query.status = req.query.status;
      } else {
        query.status = { $ne: 'used' };
      }
      
      if (search) {
        const searchRegex = new RegExp(escapeRegExp(search), 'i');
        query.$or = [
          { coreId: searchRegex },
          { serialNumber: searchRegex },
          { 'specifications.ratio': searchRegex },
          { batchId: searchRegex }
        ];
      }

      const data = await ReadyTransformer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      const totalCount = await ReadyTransformer.countDocuments(query);
      res.status(200).json({ success: true, data, totalCount });
    } else {
      let query = {};
      if (req.query.createdFrom) query.createdFrom = req.query.createdFrom;
      if (req.query.status) query.status = req.query.status;
      else query.status = { $ne: 'used' };
      const data = await ReadyTransformer.find(query).sort({ createdAt: -1 }).limit(1000).lean();
      res.status(200).json(data);
    }
  } catch (err) {
    console.error("getAllReadyTransformers Error:", err);
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
      const batch = await PreTestBatchModel.findOne({ batchId: core.batchId });
      if (batch) {
        // Ensure counts don't go negative
        const newPassedCount = Math.max(0, (batch.passedCount || 0) - 1);
        const newTotalCores = Math.max(0, (batch.numberOfCores || 0) - 1);
        
        await PreTestBatchModel.findOneAndUpdate(
          { batchId: core.batchId },
          { 
            $set: { 
              passedCount: newPassedCount,
              numberOfCores: newTotalCores 
            },
            $pull: { readings: { internalCoreNo: core.coreId } }
          }
        );
      }
    }

    if (global.io) global.io.emit("readyStockUpdated");
    res.json({ message: "Core assigned successfully", transformer: core });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReadyStockAnalytics = async (req, res) => {
  try {
    const total = await ReadyTransformer.countDocuments({ status: { $ne: "used" } });
    const available = await ReadyTransformer.countDocuments({ status: "available" });
    const used = await ReadyTransformer.countDocuments({ status: "used" });
    const reserved = await ReadyTransformer.countDocuments({ status: "reserved" });

    const metering = await ReadyTransformer.countDocuments({ status: { $ne: "used" }, coreType: "Metering" });
    const protection = await ReadyTransformer.countDocuments({ status: { $ne: "used" }, coreType: "Protection" });
    const ps = await ReadyTransformer.countDocuments({ status: { $ne: "used" }, coreType: "PS" });

    const usageRate = total > 0 ? (used / (total + used)) * 100 : 0;

    res.json({
      total,
      available,
      used,
      reserved,
      metering,
      protection,
      ps,
      usageRate
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAvailableForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { coreType } = req.query;

    let normalizedType = coreType;
    if (coreType) {
      const lower = coreType.toLowerCase();
      if (lower === 'metering') normalizedType = 'Metering';
      else if (lower === 'ps') normalizedType = 'PS';
      else if (lower === 'protection') normalizedType = 'Protection';
    }

    const query = {
      $or: [
        { status: "available" },
        { linkedOrderId: orderId }
      ]
    };
    if (normalizedType) {
      query.coreType = normalizedType;
    }

    const cores = await ReadyTransformer.find(query).lean();
    res.status(200).json(cores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAssignedToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const cores = await ReadyTransformer.find({ linkedOrderId: orderId }).lean();
    res.status(200).json({ success: true, cores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignToOrder = async (req, res) => {
  try {
    const { orderId, coreType, coreIds } = req.body;

    let normalizedType = coreType;
    if (coreType) {
      const lower = coreType.toLowerCase();
      if (lower === 'metering') normalizedType = 'Metering';
      else if (lower === 'ps') normalizedType = 'PS';
      else if (lower === 'protection') normalizedType = 'Protection';
    }

    // 1. Release all currently assigned ready stock cores of this type for this order
    await ReadyTransformer.updateMany(
      { linkedOrderId: orderId, coreType: normalizedType },
      { $set: { linkedOrderId: null, status: "available" } }
    );

    // 2. Assign the new selection
    if (coreIds && coreIds.length > 0) {
      await ReadyTransformer.updateMany(
        { coreId: { $in: coreIds }, coreType: normalizedType },
        { $set: { linkedOrderId: orderId, status: "reserved", reservationExpiresAt: null } }
      );
    }

    if (global.io) global.io.emit("readyStockUpdated");
    res.status(200).json({ success: true, message: "Cores assigned to order successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.testIndividualReadyTransformer = async (req, res) => {
  try {
    const { id } = req.params;
    const { specifications, testResults, isPass, failureReason, sendToFailedCores } = req.body;
    const userId = req.user._id;

    const core = await ReadyTransformer.findById(id);
    if (!core) {
      return res.status(404).json({ message: "Ready stock core not found" });
    }

    if (specifications) {
      core.specifications = {
        ...core.specifications,
        ...specifications
      };
    }
    if (testResults) {
      core.testResults = testResults;
    }

    if (isPass === false || sendToFailedCores) {
      // Core Failed Retest -> Send to Failed Cores section
      const { FailedCoreModel } = require('../models/FailedCoreModel');
      
      let failedRecord = await FailedCoreModel.findOne({ internalCoreNo: core.coreId });
      if (failedRecord) {
        failedRecord.status = "FAILED";
        failedRecord.failureReason = failureReason || testResults?.remark || "Failed Individual Retest in Ready Stock";
        failedRecord.failedAt = new Date();
        await failedRecord.save();
      } else {
        await FailedCoreModel.create({
          internalCoreNo: core.coreId,
          coreType: (core.coreType || 'Metering').toUpperCase(),
          failureReason: failureReason || testResults?.remark || "Failed Individual Retest in Ready Stock",
          failureStage: "READY_STOCK_RETEST",
          status: "FAILED",
          returnStatus: "PENDING"
        });
      }

      // Delete from ready stock so it's only in Failed Cores
      await ReadyTransformer.findByIdAndDelete(id);

      if (global.io) {
        global.io.emit("readyStockUpdated");
        global.io.emit("failedCoreLogged");
      }

      return res.status(200).json({
        success: true,
        sentToFailedCores: true,
        message: "Core retest failed. Core returned to Failed Cores section.",
        data: null
      });
    }

    // Core Passed -> Mark AVAILABLE in Ready Stock
    core.status = "available";
    core.testedBy = userId;
    core.testedAt = new Date();

    await core.save();

    if (global.io) global.io.emit("readyStockUpdated");

    res.status(200).json({
      success: true,
      message: "Individual core testing completed and marked AVAILABLE in Ready Stock.",
      data: core
    });
  } catch (err) {
    console.error("Error testing individual ready transformer:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.reassignCoreId = async (req, res) => {
  try {
    const { id } = req.params;
    const core = await ReadyTransformer.findById(id);
    if (!core) {
      return res.status(404).json({ success: false, message: "Core not found" });
    }

    const { getNextGlobalId } = require('../utils/idSettings');
    const newCoreId = await getNextGlobalId('preTestCoreId', { coreType: core.coreType });

    if (!newCoreId) {
      return res.status(500).json({ success: false, message: "Failed to generate new Core ID" });
    }

    const oldCoreId = core.coreId;
    core.coreId = newCoreId;
    await core.save();

    if (global.io) global.io.emit("readyStockUpdated");

    res.status(200).json({
      success: true,
      message: `Core ID reassigned from ${oldCoreId} to ${newCoreId}`,
      newCoreId
    });
  } catch (err) {
    console.error("Error reassigning Core ID:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};



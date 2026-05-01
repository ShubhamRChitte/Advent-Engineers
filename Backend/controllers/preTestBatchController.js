const { PreTestBatchModel } = require("../models/PreTestBatchModel");
const { MeteringCoreTestModel } = require("../models/MeteringCoreTestModel");
const { ProtectionCoreTestModel } = require("../models/ProtectionCoreTestModel");
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

    // Prevent creating a new batch if an unfinished one exists
    const unfinishedBatch = await PreTestBatchModel.findOne({
      createdBy: req.user._id,
      status: { $in: ["CREATED", "CONFIGURED", "IN_PROGRESS"] }
    });

    if (unfinishedBatch) {
      return res.status(400).json({ 
        message: "You have an unfinished batch. Please complete or delete it first.",
        batchId: unfinishedBatch.batchId 
      });
    }

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
    const batches = await PreTestBatchModel.find().sort({ createdAt: -1 });
    res.json(batches);
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
    const { status } = req.body;
    const batch = await PreTestBatchModel.findOneAndUpdate(
      { batchId: req.params.batchId },
      { status },
      { new: true }
    );
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

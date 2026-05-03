const mongoose = require("mongoose");
const { Schema } = mongoose;

const PreTestBatchSchema = new Schema({
  batchId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  vendorName: {
    type: String,
    required: true
  },
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: "CoreVendor",
    index: true
  },
  coreType: {
    type: String,
    enum: ["Metering", "Protection", "PS"],
    required: true
  },
  numberOfCores: {
    type: Number,
    required: true
  },
  turns: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["CREATED", "CONFIGURED", "IN_PROGRESS", "COMPLETED"],
    default: "CREATED"
  },
  passedCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  discardedCount: {
    type: Number,
    default: 0
  },
  // Permanent log of core IDs that were discarded/replaced — never removed once added.
  // Used to ensure skeleton row IDs skip these slots on reload.
  discardedCoreIds: {
    type: [String],
    default: []
  },
  
  // Storage for in-progress testing data
  testSetup: {
    type: Object,
    default: {}
  },
  testLimits: {
    type: Object,
    default: {}
  },
  readings: {
    type: [Object],
    default: []
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

const PreTestBatchModel = mongoose.model("PreTestBatch", PreTestBatchSchema);

module.exports = { PreTestBatchModel };

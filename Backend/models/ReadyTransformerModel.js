const mongoose = require('mongoose');

const ReadyTransformerSchema = new mongoose.Schema({
  coreId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  batchId: {
    type: String,
    required: true,
    index: true
  },
  coreType: {
    type: String,
    enum: ["Metering", "Protection", "PS"],
    required: true
  },
  createdFrom: {
    type: String,
    enum: ["MANUAL", "PRE_TEST", "ORDER_FAIL"],
    required: true,
    default: "MANUAL"
  },
  specifications: {
    ratio: String,
    burden: String,
    class: String,
    turns: String
  },
  testResults: {
    type: Object, // same structure as readings
    required: true
  },
  testedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  testedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["available", "reserved", "used"],
    default: "available"
  },
  linkedOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null
  },
  usedInReplacementOf: {
    type: String, // failed coreId
    default: null
  },
  reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  reservationExpiresAt: {
    type: Date,
    default: null
  },
  usageLogs: [
    {
      usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      usedAt: { type: Date, default: Date.now },
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      failedCoreId: String
    }
  ]
}, { timestamps: true });

// Performance Index
ReadyTransformerSchema.index({
  "specifications.ratio": 1,
  "specifications.burden": 1,
  "specifications.class": 1,
  coreType: 1,
  status: 1
});

module.exports = mongoose.model("ReadyTransformer", ReadyTransformerSchema);

const { Schema } = require("mongoose");

const ProtectionCoreTestSchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: "order",
    required: true
  },

  transformerSerialNo: {
    type: String,
    required: true
  },

  coreIndex: {
    type: Number,
    required: true
  },

  coreType: {
    type: String,
    enum: ["Protection","PS"],
    default: "Protection"
  },

  // ---- CORE & TEST SETUP (HEADER PART) ----
  testSetup: {
    description: {
      type: String,
      required: true   // e.g., M4CRGO
    },

    coreSizeMm: {
      id: Number,
      od: Number,
      height: Number
    },

    turnsUsed: {
      type: Number,
      required: true
    },

    areaSqCm: Number,
    mmp: Number
  },

  // ---- TEST SPECIFICATION ----
  testSpecification: {
    fluxTesla: Number,    // B (Flux in Tesla)
    voltageV: Number,     // Voltage in V
    iexLimitMa: Number    // Iex limit in mA
  },

  // ---- ACTUAL READINGS ----
  readings: [
    {
      date: Date,
      vendorCoreNo: String,
      internalCoreNo: String,

      value: Number,      // Reading value
      result: {
        type: String,
        enum: ["P", "F"]
      }
    }
  ],

  testedBy: String,
  authorisedBy: String

}, { timestamps: true });

module.exports = { ProtectionCoreTestSchema };

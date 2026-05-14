const { Schema } = require("mongoose");

const ProtectionCoreTestSchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: "Order",
    required: false
  },
  batchId: {
    type: String,
    index: true
  },
  isPreTest: {
    type: Boolean,
    default: false
  },
  vendorName: {
    type: String
  },
  coreType: {
    type: String,
    enum: ["Protection", "PS"],
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

      value: Number,      // Single reading value (legacy / backward compat)
      measuredMa: [Number], // Multi-point dynamic readings (Protection/PS columns)
      result: {
        type: String,
        enum: ["P", "F", "PRE_TESTED"]
      },
      status: {
        type: String,
        enum: ["PENDING", "PASS", "FAIL", "RETURNED"],
        default: "PENDING"
      },
      isReplacement: {
        type: Boolean,
        default: false
      },
      replacedCoreId: {
        type: String,
        trim: true
      },
      verified: {
        type: Boolean,
        default: true
      },
      source: {
        type: String,
        enum: ["MANUAL", "READY_STOCK"],
        default: "MANUAL"
      }
    }
  ],

  testedBy: String,
  authorisedBy: String,
  reportDate: { type: Date }

}, { timestamps: true });

module.exports = { ProtectionCoreTestSchema };

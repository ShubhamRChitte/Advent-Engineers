const { Schema } = require("mongoose");

const MeteringCoreTestSchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  coreType: {
    type: String,
    enum: ["Metering"],
    default: "Metering"
  },

  // ---- CORE & TEST SETUP (HEADER PART) ----
  testSetup: {
    coreMaterial: {
      type: String, // e.g. TOROIDAL CORE NANO CRYSTALLINE
      required: true
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

  // ---- LIMITS / RANGES (VERY IMPORTANT) ----
  testLimits: {
    bsatGauss: [Number],
    // Example: [1000, 3000, 5000, 7000]

    setMilliVolt: [Number],
    // Example: [93.19, 277.64, 465.96, 652.34]

    leLimitMa: [Number]
    // Example: [17.14, 34.28, 42.86, 56.73]
  },

  // ---- ACTUAL READINGS ----
  readings: [
    {
      date: Date,
      vendorCoreNo: String,
      internalCoreNo: String,

      measuredMa: [Number],
      // Example: [9.5, 18.3, 24.7, 30.6]

      result: {
        type: String,
        enum: ["P", "F"]
      },
      status: {
        type: String,
        enum: ["PENDING", "PASS", "FAIL", "RETURNED"],
        default: "PENDING"
      }
    }
  ],

  testedBy: String,
  authorisedBy: String,
  reportDate: { type: Date }

}, { timestamps: true });


module.exports = { MeteringCoreTestSchema };
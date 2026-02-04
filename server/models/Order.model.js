const { Schema, model } = require("mongoose");

const CoreDetailSchema = new Schema({
  coreType: {
    type: String,
    enum: ["Metering", "Protection", "PS"],
    required: true,
  },
});

const OrderSchema = new Schema(
  {
    jobId: { type: String, required: true, unique: true },

    clientName: String,
    clientContactNo: String,

    ratio: [String],

    transformerName: String,
    transformerType: { type: String, enum: ["CT", "PT"] },
    quantity: Number,

    noOfCores: Number,
    coreDetails: [CoreDetailSchema],

    nominalSystemVoltage: Number,
    burden: Number,
    ratedPrimaryCurrent: Number,
    ratedSecondaryCurrent: Number,
    accuracyClass: String,

    mountingDetails: String,
    overallDimension: String,

    deadline: Date,
    instructions: String,

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },

    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },

    isStandard: String,

    // 🔑 THIS feeds your progress bars
    progress: {
      coreWinding: Number,
      insulation: Number,
      testing: Number,
      packaging: Number,
    },
  },
  { timestamps: true }
);

module.exports = model("Order", OrderSchema);

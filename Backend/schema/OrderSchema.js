const { Schema } = require("mongoose");

const CoreDetailSchema = new Schema({
  coreType: {
    type: String,
    required: true,
    enum: ["Metering", "Protection", "PS"]
  }
});

const OrderSchema = new Schema(
  {
    jobId:{
    type: String,
    required: true,
    unique: true,
    trim: true
    },
    // -------- CLIENT DETAILS --------
    clientName: {
      type: String,
      required: true,
      trim: true
    },

    ratio: [String],

    clientContactNo: {
      type: String,
      required: true,
      trim: true
    },

    // -------- TRANSFORMER DETAILS --------
    transformerName: {
      type: String,
      required: true,
      trim: true
    },

    transformerType: {
      type: String,
      required: true,
      enum: ["CT", "PT"]
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    // -------- CORE CONFIGURATION --------
    noOfCores: {
      type: Number,
      required: true,
      min: 1
    },

    coreDetails: {
      type: [CoreDetailSchema],
      required: true,
      validate: {
        validator: function (value) {
          return value.length === this.noOfCores;
        },
        message: "Core details count must match number of cores"
      }
    },

    // -------- ELECTRICAL PARAMETERS --------
    nominalSystemVoltage: {
      type: Number,
      required: true
    },

    burden: {
      type: Number,
      required: true
    },

    ratedPrimaryCurrent: {
      type: Number,
      required: true
    },

    ratedSecondaryCurrent: {
      type: Number,
      required: true
    },

    accuracyClass: {
      type: String,
      required: true,
      trim: true
    },

    // -------- MECHANICAL DETAILS --------
    mountingDetails: {
      type: String,
      required: true,
      trim: true
    },

    overallDimension: {
      type: String,
      required: true,
      trim: true
    },

    // -------- WORKFLOW / ORDER MANAGEMENT --------
    deadline: {
      type: Date,
      required: true
    },

    instructions: {
      type: String,
      trim: true
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending"
    },

    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium"
    },

    // -------- STANDARD / NON-STANDARD --------
    isStandard: {
      type: String,
      required: true,
      trim: true
    },
  //   assignments: {
  //   core_tester: { type: String, required: true },      // Worker ID or Name
  //   secondary_tester: { type: String, required: true },
  //   primary_tester: { type: String, required: true },
  //   final_tester: { type: String, required: true }
  // },
  },
  {
    timestamps: true
  }
);

module.exports = { OrderSchema };





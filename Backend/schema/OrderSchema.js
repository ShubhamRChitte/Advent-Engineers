const { Schema } = require("mongoose");

const OrderSchema = new Schema(
  {
    jobId: { type: String, unique: true }, // Auto-generated: JOB-2026-001
    clientName: { type: String, required: true, trim: true },
    clientContactNo: { type: String, required: true, trim: true },

    // Transformer Specs
    transformerName: { type: String, required: true },
    transformerType: { type: String, enum: ["CT", "PT"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    ratio: [String],

    // Core Configuration
    noOfCores: { type: Number, required: true },
    coreDetails: [{
      coreType: { type: String, enum: ["Metering", "Protection", "PS"], required: true }
    }],

    // Electrical & Mechanical (Simplified for brevity)
    nominalSystemVoltage: Number,
    burden: Number,
    accuracyClass: String,
    deadline: { type: Date, required: true },

    // --- WORKER ASSIGNMENTS ---
    // Add this to your OrderSchema
    assignments: [
      {
        testerName: { type: String, required: true }, // e.g., "Rahul Sharma"
        stage: {
          type: String,
          enum: ["core", "secondary", "primary", "final"],
          required: true
        },
        unitRange: {
          from: { type: Number, required: true }, // e.g., 1
          to: { type: Number, required: true }    // e.g., 50
        },
        status: { type: String, default: "Assigned" } // "Assigned", "In Progress", "Completed"
      }
    ],

    // --- WORKFLOW TRACKING (NEW) ---
    currentStage: {
      type: String,
      enum: ["core", "secondary", "primary", "final", "completed"],
      default: "core" // Determines which dashboard this order appears on
    },

    completionStages: {
      core: { type: Boolean, default: false },
      secondary: { type: Boolean, default: false },
      primary: { type: Boolean, default: false },
      final: { type: Boolean, default: false }
    },



    // --- ADMIN APPROVAL & NOTIFICATION ---
    isApproved: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false }, // For Admin Notification badge
    status: {
      type: String,
      enum: ["Pending Approval", "In Progress", "Completed", "Core Testing In Progress", "Core Testing Completed"],
      default: "Pending Approval"
    },
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    ratedPrimaryCurrent: {
      type: Number,
      required: true
    },

    ratedSecondaryCurrent: {
      type: Number,
      required: true
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
    instructions: {
      type: String,
      trim: true
    },
    // -------- STANDARD / NON-STANDARD --------
    isStandard: {
      type: String,
      required: true,
      trim: true
    },
  },

  { timestamps: true }
);

module.exports = { OrderSchema };
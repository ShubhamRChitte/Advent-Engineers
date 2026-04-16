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
      coreType: { type: String, enum: ["Metering", "Protection", "PS"], required: true },
      accuracyClass: { type: String },
      vendorNo: { type: String }
    }],

    // Structured Core Vendors
    coreVendors: {
      metering: [{ serialNo: Number, name: String }],
      protection: [{ serialNo: Number, name: String }],
      ps: [{ serialNo: Number, name: String }]
    },

    // Electrical & Mechanical (Simplified for brevity)
    nominalSystemVoltage: Number,
    burden: Number,
    deadline: { type: Date, required: true },
    approved: { type: Boolean, default: false }, // Work-flow field to control visibility in Orders tab

    // --- WORKER ASSIGNMENTS ---
    // Add this to your OrderSchema
    assignments: [
      {
        testerName: { type: String, required: true }, // e.g., "Rahul Sharma"
        stage: {
          type: String,
          enum: ["core", "secondary", "primary", "heating", "final", "pt"],
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
      enum: ["core", "secondary", "primary", "heating", "final", "completed", "pt"],
      default: "core" // Determines which dashboard this order appears on
    },

    completionStages: {
      core: { type: Boolean, default: false },
      secondary: { type: Boolean, default: false },
      primary: { type: Boolean, default: false },
      heating: { type: Boolean, default: false },
      final: { type: Boolean, default: false },
      pt: { type: Boolean, default: false }
    },

    // --- TESTING STATS (Derived from Core Testing) ---
    testsCompleted: { type: Number, default: 0 },
    passCount: { type: Number, default: 0 },
    failCount: { type: Number, default: 0 },
    reportData: { type: Schema.Types.Mixed }, // Structured data for rendering full report


    // --- ADMIN APPROVAL & NOTIFICATION ---
    isApproved: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false }, // For Admin Notification badge
    status: {
      type: String,
      enum: ["Pending Approval", "In Progress", "Completed", "Core Testing In Progress", "Core Testing Completed", "PT Testing In Progress", "PT Testing Completed"],
      default: "Pending Approval"
    },
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    ratedPrimaryCurrent: {
      type: Number,
      required: false
    },

    ratedSecondaryCurrent: {
      type: Number,
      required: true
    },
    voltageRating: {
      type: String,
      required: false
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
    indoorOutdoor: {
      type: String,
      trim: true
    },
    insulationType: {
      type: String,
      trim: true
    },
    tankType: {
      type: String,
      trim: true
    },
    stc: {
      type: String,
      trim: true
    },
    images: [{
      url: String, // Cloudinary secure_url
      public_id: String // Cloudinary public_id for deletion
    }]
  },

  { timestamps: true }
);

module.exports = { OrderSchema };
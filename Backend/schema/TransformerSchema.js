const { Schema } = require("mongoose");

// // // --- METERING SCHEMA ---
// // const MeteringRowSchema = new Schema({
// //   current: String,
// //   r100: String, p100: String, r25: String, p25: String
// // });

// // const MeteringBlockSchema = new Schema({
// //   ratioValue: String,
// //   rows: [MeteringRowSchema]
// // });

// // // --- PROTECTION SCHEMA ---
// // const ProtectionBlockSchema = new Schema({
// //   ratioValue: String,
// //   burden100: String,
// //   resistance: String,
// //   secondaryLimitingVtg: String,
// //   excitationCurrent: String,
// //   compositeError: String
// // });

// // // --- PS SCHEMA ---
// // const PSBlockSchema = new Schema({
// //   ratioValue: String,
// //   turnRatioError: String,
// //   resistance: String,
// //   vk: String,
// //   vkVal: String, // 1.1Vk
// //   iexVk: String,
// //   iex11Vk: String
// // });

// // // --- UNIFIED STAGE SCHEMA ---
// // const TestStageSchema = new Schema({
// //   tester: String,
// //   timestamp: { type: Date, default: Date.now },
// //   status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
// //   metering_results: [MeteringBlockSchema],
// //   protection_results: [ProtectionBlockSchema],
// //   ps_results: [PSBlockSchema]
// // });

// // // --- MAIN TRANSFORMER SCHEMA ---
// // const TransformerSchema = new Schema({
// //   uniqueId: { type: String, required: true, unique: true },
// //   ratings: [String], // Array of CT ratios
// //   coreType: [String], // ["Metering", "Protection", "PS"]
// //   testHistory: {
// //     secondary_login: { type: [TestStageSchema], default: () => ({}) },
// //     primary_login: { type: [TestStageSchema], default: () => ({}) },
// //     final_test_login: { type: [TestStageSchema], default: () => ({}) }
// //   }
// // });





// // --- METERING SCHEMA ---
// const MeteringRowSchema = new Schema({
//   current: String,
//   r100: String, 
//   p100: String, 
//   r25: String, 
//   p25: String
// });

// const MeteringBlockSchema = new Schema({
//   ratioValue: String, // e.g., "200/1"
//   rows: [MeteringRowSchema]
// });

// // --- PROTECTION SCHEMA ---
// const ProtectionBlockSchema = new Schema({
//   ratioValue: String,
//   burden100_1: String,
//   burden100_2: String,
//   resistance: String,
//   secondaryLimitingVtg: String,
//   excitationCurrent: String,
//   compositeError: String
// });

// // --- PS SCHEMA ---
// const PSBlockSchema = new Schema({
//   ratioValue: String,
//   turnRatioError: String,
//   resistance: String,
//   vk: String,
//   vkVal: String, // 1.1Vk
//   iexVk: String,
//   iex11Vk: String
// });

// // --- UNIFIED STAGE SCHEMA ---
// const TestStageSchema = new Schema({
//   tester: String,
//   timestamp: { type: Date, default: Date.now },
//   status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
//   metering_results: [MeteringBlockSchema],
//   protection_results: [ProtectionBlockSchema],
//   ps_results: [PSBlockSchema]
// });

// // --- MAIN TRANSFORMER SCHEMA ---
// const TransformerSchema = new Schema({
//   uniqueId: { type: String, required: true, unique: true },
//   // ratings: [String], // Array of CT ratios: ["200/1", "400/1"]
//   // coreType: [String], // ["Metering", "Protection", "PS"]
//   orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
//   currentStage: { 
//     type: String, 
//     enum: ["core", "secondary", "primary", "final", "shipped"], 
//     default: "core" 
//   },
//   // Storage for the 3 Login Stages as Objects, not Arrays
//   testHistory: {
//     secondary_login: { type: TestStageSchema, default: () => ({}) },
//     primary_login: { type: TestStageSchema, default: () => ({}) },
//     final_test_login: { type: TestStageSchema, default: () => ({}) }
//   }
// }, { timestamps: true });


// module.exports = { TransformerSchema };






// --- 1. RESULT NESTED SCHEMAS (For specific core types) ---

const MeteringRowSchema = new Schema({
  current: String,
  r100: String, 
  p100: String, 
  r25: String, 
  p25: String,
  // Validation fields added to prevent stripping by Mongoose
  r100_r_pass: { type: Boolean, default: null },
  r100_p_pass: { type: Boolean, default: null },
  r100_pass: { type: Boolean, default: null },
  r100_reason: { type: String, default: null },
  r25_r_pass: { type: Boolean, default: null },
  r25_p_pass: { type: Boolean, default: null },
  r25_pass: { type: Boolean, default: null },
  r25_reason: { type: String, default: null }
}, { strict: false });

const MeteringBlockSchema = new Schema({
  ratioValue: String, // e.g., "200/1"
  rows: [MeteringRowSchema]
}, { strict: false });

const ProtectionBlockSchema = new Schema({
  ratioValue: String, // e.g., "200/1"
  protectionClass: String,
  // Map the top-row measurements specifically
  ratioError100: { type: Number, default: 0 }, // Was burden100_1
  phaseError: { type: Number, default: 0 },    // Was burden100_2

  // Test Parameters
  resistance: { type: Number, default: 0 },
  alf: { type: Number, default: 0 },
  excitationCurrent: { type: Number, default: 0 },

  // Automated Result Fields
  secondaryLimitingVoltage: { type: Number, default: 0 },
  compositeError: { type: Number, default: 0 },

  // Maintain legacy field to prevent breaking old reports
  secondaryLimitingVtg: Schema.Types.Mixed,

  // Validation Results
  isPass: { type: Boolean, default: null },
  reason: { type: String, default: null }
}, { strict: false });

const PSBlockSchema = new Schema({
  ratioValue: String,
  turnRatioError: String,
  resistance: String,
  vk: String,
  vkVal: String, // 1.1Vk
  iexVk: String,
  iex11Vk: String
}, { strict: false });

// --- 2. UNIFIED STAGE SCHEMA ---

const TestStageSchema = new Schema({
  tester: String,
  timestamp: { type: Date, default: Date.now },
  reportDate: { type: Date },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Approved'], default: 'Pending' },

  // These arrays will hold the results based on the Order's core configuration
  metering_results: [MeteringBlockSchema],
  protection_results: [ProtectionBlockSchema],
  ps_results: [PSBlockSchema],

  // New: Final QA Specific Fields (Stored in testHistory.final_test)
  polarityResult: { type: String },
  meggarPrimaryToSecondary: { type: String },
  meggarSecondaryToEarth: { type: String },
  meggarPrimaryToEarth: { type: String },
  hvTestPrimaryToSecondary: { type: String },
  hvTestSecondaryToEarth: { type: String },
  hvTestPrimaryToEarth: { type: String },
  ovitTest: { type: String },
  ovitDuration: { type: String },
  ovitRemarks: { type: String },
  generalRemarks: { type: String },
  isApproved: { type: Boolean, default: false }
}, { strict: false });

// --- 3. MAIN TRANSFORMER SCHEMA ---

const TransformerSchema = new Schema({
  // Global Serial Number (Generated automatically after Admin Approval)
  uniqueId: { type: String, required: true, unique: true },

  // Connection to Parent Order
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  jobId: { type: String, required: true }, // Redundant for faster searching

  // Workflow tracking
  currentStage: {
    type: String,
    enum: ["core", "secondary", "primary", "heating", "final", "shipped", "pt", "admin_review"],
    default: "core"
  },

  isHeatingApproved: { type: Boolean, default: false },

  // Track Admin Reassignment/Approval details
  adminReviewDetails: {
    failedStage: { type: String },
    returnTargetStage: { type: String },
    requestedAt: { type: Date }
  },

    // The 5 Testing Stages (Workflow: Core -> Secondary -> Primary -> Heating -> Final)
    testHistory: {
      core_test: { type: TestStageSchema, default: {} },
      secondary_test: { type: TestStageSchema, default: {} },
      primary_test: { type: TestStageSchema, default: {} },
      heating_test: {
        status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Approved'], default: 'Pending' },
        timestamp: { type: Date, default: Date.now },
        processSteps: [{
          process: String,
          duration: String,
          startDateTime: Date,
          completionDateTime: Date,
          startDate: String,
          startTime: String,
          completionDate: String,
          completionTime: String,
          remarks: String
        }],
        leftInputs: [{ col1: String, col2: String }],
        preparedBy: String,
        productionManager: String,
        verifiedBy: String,
        reportDate: { type: Date, default: Date.now }
      },
      final_test: { type: TestStageSchema, default: {} },
      pt_test: { type: Schema.Types.Mixed, default: {} }
    },

  // Granular Assignments (Per-Unit)
  assignments: {
    core_tester: String,
    secondary_tester: String,
    primary_tester: String,
    final_tester: String,
    pt_tester: String
  },

  // Added newly for primary testing
  processHistory: {
    heatingRecord: [{
      transformerId: String,
      jobNumber: String,
      processSteps: [{
        process: String,
        duration: String,
        startDateTime: Date,
        completionDateTime: Date,
        remarks: String
      }],
      preparedBy: String,
      productionManager: String,
      verifiedBy: String,
      reportDate: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ["Pending", "In Progress", "Completed", "Approved"],
        default: "Pending"
      },
      recordedBy: String,
      recordedAt: { type: Date, default: Date.now }
    }],
    // Isolated schema for 33KV PT Heating Record
    ptHeatingRecord: [{
      transformerId: String,
      jobNumber: String,
      processSteps: [{
        process: String,
        duration: String,
        startTime: String,
        completionTime: String,
        remarks: String
      }],
      preparedBy: String,
      productionManager: String,
      verifiedBy: String,
      date: String,
      recordedBy: String, 
      recordedAt: { type: Date, default: Date.now }
    }]
  },

  // Stores the actual snapshot data configured at Final Test generation
  finalReportData: {
    type: Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true });

// --- 4. EXPORT ---
module.exports = { TransformerSchema };

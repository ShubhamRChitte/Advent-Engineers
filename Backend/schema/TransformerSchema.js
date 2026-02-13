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
  r100: String, p100: String, r25: String, p25: String
});

const MeteringBlockSchema = new Schema({
  ratioValue: String, // e.g., "200/1"
  rows: [MeteringRowSchema]
}, { strict: false });

const ProtectionBlockSchema = new Schema({
  ratioValue: String, // e.g., "200/1"
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
  secondaryLimitingVtg: Schema.Types.Mixed 
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
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },

  // These arrays will hold the results based on the Order's core configuration
  metering_results: [MeteringBlockSchema],
  protection_results: [ProtectionBlockSchema],
  ps_results: [PSBlockSchema]
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
    enum: ["core", "secondary", "primary", "final", "shipped"],
    default: "core"
  },

  // The 4 Testing Stages
  testHistory: {
    core_test: { type: TestStageSchema, default: {} },
    secondary_test: { type: TestStageSchema, default: {} },
    primary_test: { type: TestStageSchema, default: {} },
    final_test: { type: TestStageSchema, default: {} }
  },

  // Granular Assignments (Per-Unit)
  assignments: {
    core_tester: String,
    secondary_tester: String,
    primary_tester: String,
    final_tester: String
  }
}, { timestamps: true });

// --- 4. EXPORT ---
module.exports = { TransformerSchema };


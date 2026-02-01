const { Schema } = require("mongoose");

// // --- METERING SCHEMA ---
// const MeteringRowSchema = new Schema({
//   current: String,
//   r100: String, p100: String, r25: String, p25: String
// });

// const MeteringBlockSchema = new Schema({
//   ratioValue: String,
//   rows: [MeteringRowSchema]
// });

// // --- PROTECTION SCHEMA ---
// const ProtectionBlockSchema = new Schema({
//   ratioValue: String,
//   burden100: String,
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
//   ratings: [String], // Array of CT ratios
//   coreType: [String], // ["Metering", "Protection", "PS"]
//   testHistory: {
//     secondary_login: { type: [TestStageSchema], default: () => ({}) },
//     primary_login: { type: [TestStageSchema], default: () => ({}) },
//     final_test_login: { type: [TestStageSchema], default: () => ({}) }
//   }
// });





// --- METERING SCHEMA ---
const MeteringRowSchema = new Schema({
  current: String,
  r100: String, 
  p100: String, 
  r25: String, 
  p25: String
});

const MeteringBlockSchema = new Schema({
  ratioValue: String, // e.g., "200/1"
  rows: [MeteringRowSchema]
});

// --- PROTECTION SCHEMA ---
const ProtectionBlockSchema = new Schema({
  ratioValue: String,
  burden100_1: String,
  burden100_2: String,
  resistance: String,
  secondaryLimitingVtg: String,
  excitationCurrent: String,
  compositeError: String
});

// --- PS SCHEMA ---
const PSBlockSchema = new Schema({
  ratioValue: String,
  turnRatioError: String,
  resistance: String,
  vk: String,
  vkVal: String, // 1.1Vk
  iexVk: String,
  iex11Vk: String
});

// --- UNIFIED STAGE SCHEMA ---
const TestStageSchema = new Schema({
  tester: String,
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
  metering_results: [MeteringBlockSchema],
  protection_results: [ProtectionBlockSchema],
  ps_results: [PSBlockSchema]
});

// --- MAIN TRANSFORMER SCHEMA ---
const TransformerSchema = new Schema({
  uniqueId: { type: String, required: true, unique: true },
  ratings: [String], // Array of CT ratios: ["200/1", "400/1"]
  coreType: [String], // ["Metering", "Protection", "PS"]
  // orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  // currentStage: { 
  //   type: String, 
  //   enum: ["core", "secondary", "primary", "final", "shipped"], 
  //   default: "core" 
  // },
  // Storage for the 3 Login Stages as Objects, not Arrays
  testHistory: {
    secondary_login: { type: TestStageSchema, default: () => ({}) },
    primary_login: { type: TestStageSchema, default: () => ({}) },
    final_test_login: { type: TestStageSchema, default: () => ({}) }
  }
}, { timestamps: true });


module.exports = { TransformerSchema };

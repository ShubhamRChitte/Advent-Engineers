const mongoose = require('mongoose');

const CTTimerSchema = new mongoose.Schema({
  transformerId:    { type: String, required: true },
  orderId:          { type: String, required: true },
  jobId:            { type: String, required: true, default: 'UNKNOWN' },
  testerId:         { type: String, default: '' },
  testerName:       { type: String, required: true },
  role:             { type: String, required: true }, // core-tester | secondary-tester | after-primary-tester | final-tester
  stage:            { type: String, required: true }, // core | secondary | after_primary | final
  coreCount:        { type: Number, default: 1 },     // for after_primary conditional logic
  startTime:        { type: Date,   required: true },
  endTime:          { type: Date },
  expectedMinutes:  { type: Number, required: true },
  actualTimeMs:     { type: Number },
  delayMs:          { type: Number, default: 0 },
  isDelayed:        { type: Boolean, default: false },
  status:           { type: String, enum: ['In Progress', 'Completed', 'Abandoned'], default: 'In Progress' },
  completedCoresList: { type: [String], default: [] },
  completedCores:   { type: Number, default: 0 },
  totalCores:       { type: Number, default: 1 },
  isRunning:        { type: Boolean, default: true },
  totalElapsedMs:   { type: Number, default: 0 }
}, { timestamps: true });

CTTimerSchema.index({ transformerId: 1, stage: 1, status: 1 });

module.exports = { CTTimerSchema };

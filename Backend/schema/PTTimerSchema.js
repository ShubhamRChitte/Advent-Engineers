const { Schema } = require('mongoose');

const PTTimerSchema = new Schema(
  {
    transformerId: { type: Schema.Types.ObjectId, ref: 'Transformer', required: true },
    orderId:       { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    jobId:         { type: String, required: true }, // Redundant for fast dashboard queries

    testerId:    { type: String },   // user._id as string
    testerName:  { type: String, required: true },
    role:        { type: String, enum: ['pt-pretester', 'pt-tester'], required: true },
    stage:       { type: String, enum: ['pt_pretest', 'pt'], required: true },

    startTime:       { type: Date },
    endTime:         { type: Date },
    expectedMinutes: { type: Number }, // from SettingsModel at start time

    // Computed on end
    actualTimeMs: { type: Number, default: 0 },
    delayMs:      { type: Number, default: 0 },
    isDelayed:    { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['In Progress', 'Completed', 'Abandoned'],
      default: 'In Progress'
    }
  },
  { timestamps: true }
);

module.exports = { PTTimerSchema };

const { Schema } = require('mongoose');

const InspectionTransformerSchema = new Schema({
  transformerId: { type: String, required: true },   // transformer uniqueId
  jobId:         { type: String, required: true },
  customerName:  { type: String, default: '' },
  orderId:       { type: Schema.Types.ObjectId, ref: 'Order', default: null },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  reportData:  { type: Schema.Types.Mixed, default: {} },  // all inspection fields
  startedAt:   { type: Date },
  completedAt: { type: Date }
}, { _id: false });

const PTInspectionBatchSchema = new Schema({
  batchNumber: { type: String, required: true, unique: true },  // e.g. INS-PT-2026-001
  createdBy:   { type: String, required: true },
  status: {
    type: String,
    enum: ['In Progress', 'Completed'],
    default: 'In Progress'
  },
  transformers: { type: [InspectionTransformerSchema], default: [] }
}, { timestamps: true });

module.exports = { PTInspectionBatchSchema };

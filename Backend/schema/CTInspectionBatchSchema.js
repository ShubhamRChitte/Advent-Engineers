const { Schema } = require('mongoose');

const CTInspTransformerSchema = new Schema({
  transformerId: { type: String, required: true },
  jobId:         { type: String, required: true },
  customerName:  { type: String, default: '' },
  orderId:       { type: Schema.Types.ObjectId, ref: 'Order', default: null },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  reportData:  { type: Schema.Types.Mixed, default: {} },
  startedAt:   { type: Date },
  completedAt: { type: Date }
}, { _id: false });

const CTInspectionBatchSchema = new Schema({
  batchNumber: { type: String, required: true, unique: true },  // e.g. INS-CT-2026-001
  createdBy:   { type: String, required: true },
  status: {
    type: String,
    enum: ['In Progress', 'Completed'],
    default: 'In Progress'
  },
  transformers: { type: [CTInspTransformerSchema], default: [] }
}, { timestamps: true });

module.exports = { CTInspectionBatchSchema };

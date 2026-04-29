const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const strictApprovalSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  jobId: { type: String, required: true },
  unitId: { type: String, required: true }, // Unique ID of the transformer
  clientName: { type: String },
  coreType: { type: String }, // 'Metering' | 'Protection' | 'PS'
  testType: { type: String, required: true }, // e.g., 'Secondary Testing'
  failureReason: { type: String, required: true }, // e.g., 'Ratio error exceeded limit'
  requestedBy: { type: String, required: true }, // Tester's name
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  resolvedBy: { type: String }, // Admin name
  resolutionRemark: { type: String },
  testData: { type: Schema.Types.Mixed }, // Store the actual test readings that failed
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StrictApproval', strictApprovalSchema);

const mongoose = require('mongoose');

const SecondaryMeteringTestSchema = new mongoose.Schema({
    uniqueId: { type: String, required: false }, // Transformer Unique ID (e.g. TR-2026-001/01)
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Optional linkage
    coreId: { type: String, required: true },   // Core ID (e.g. M-001)
    tester: { type: String, required: true },
    isAssigned: { type: Boolean, default: false },
    assignedUniqueId: { type: String },
    turnsUsed: { type: Number },
    testDate: { type: Date, default: Date.now },
    reportDate: { type: Date },

    // Structure to store dynamic ratio table data
    metering_results: [
        {
            ratioValue: { type: String }, // e.g. "200/1"
            rows: [
                {
                    current: String,
                    r100: String,
                    p100: String,
                    r25: String,
                    p25: String
                }
            ]
        }
    ],

    // Metadata
    remarks: { type: String },
    status: { type: String, default: 'Pending' }, // Pass/Fail based on analysis

}, { timestamps: true });

const SecondaryMeteringTestModel = mongoose.model('SecondaryMeteringTest', SecondaryMeteringTestSchema);

module.exports = { SecondaryMeteringTestModel };

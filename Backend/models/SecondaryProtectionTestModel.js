const mongoose = require('mongoose');

const SecondaryProtectionTestSchema = new mongoose.Schema({
    uniqueId: { type: String, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    coreId: { type: String, required: true },
    tester: { type: String, required: true },
    testDate: { type: Date, default: Date.now },

    protection_results: [
        {
            internalCoreNo: String,
            ratioValue: String,
            burden100_1: String,
            burden100_2: String,
            resistance: String,
            alf: String,
            secondaryLimitingVtg: String,
            excitationCurrent: String,
            compositeError: String
        }
    ],

    remarks: { type: String },
    status: { type: String, default: 'Completed' }
}, { timestamps: true });

const SecondaryProtectionTestModel = mongoose.model('SecondaryProtectionTest', SecondaryProtectionTestSchema);

module.exports = { SecondaryProtectionTestModel };

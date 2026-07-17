const mongoose = require('mongoose');

const SecondaryProtectionTestSchema = new mongoose.Schema({
    uniqueId: { type: String, required: false },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    coreId: { type: String, required: true },
    tester: { type: String, required: true },
    testDate: { type: Date, default: Date.now },
    reportDate: { type: Date },

    protection_results: [
        {
            ratioValue: { type: String },
            protectionClass: { type: String },
            ratioError100: { type: Number, default: null },
            phaseError: { type: Number, default: null },
            resistance: { type: Number, default: null },
            alf: { type: Number, default: null },
            excitationCurrent: { type: Number, default: null },
            secondaryLimitingVoltage: { type: Number, default: null },
            compositeError: { type: Number, default: null },
            secondaryLimitingVtg: mongoose.Schema.Types.Mixed,
            isPass: { type: Boolean, default: null },
            reason: { type: String, default: null },
            internalCoreNo: { type: String }
        }
    ],

    remarks: { type: String },
    status: { type: String, default: 'Pending' },
    isAssigned: { type: Boolean, default: false },
    assignedUniqueId: { type: String },
    turnsUsed: { type: Number }
}, { timestamps: true });

const SecondaryProtectionTestModel = mongoose.model('SecondaryProtectionTest', SecondaryProtectionTestSchema);

module.exports = { SecondaryProtectionTestModel };

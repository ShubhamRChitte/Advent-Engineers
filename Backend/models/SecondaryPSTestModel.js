const mongoose = require('mongoose');

const SecondaryPSTestSchema = new mongoose.Schema({
    uniqueId: { type: String, required: false },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    coreId: { type: String, required: true },
    tester: { type: String, required: true },
    testDate: { type: Date, default: Date.now },
    reportDate: { type: Date },

    ps_results: [
        {
            ratioValue: { type: String },
            turnRatioError: { type: String },
            resistance: { type: String },
            vk: { type: String },
            vkVal: { type: String },
            iexVk: { type: String },
            iex11Vk: { type: String },
            internalCoreNo: { type: String }
        }
    ],

    remarks: { type: String },
    status: { type: String, default: 'Pending' },
    isAssigned: { type: Boolean, default: false },
    assignedUniqueId: { type: String },
    turnsUsed: { type: Number }
}, { timestamps: true });

const SecondaryPSTestModel = mongoose.model('SecondaryPSTest', SecondaryPSTestSchema);

module.exports = { SecondaryPSTestModel };

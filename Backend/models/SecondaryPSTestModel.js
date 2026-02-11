const mongoose = require('mongoose');

const SecondaryPSTestSchema = new mongoose.Schema({
    uniqueId: { type: String, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    coreId: { type: String, required: true },
    tester: { type: String, required: true },
    testDate: { type: Date, default: Date.now },

    ps_results: [
        {
            internalCoreNo: String,
            ratioValue: String,
            turnRatioError: String,
            resistance: String,
            vk: String,
            vkVal: String,
            iexVk: String,
            iex11Vk: String
        }
    ],

    remarks: { type: String },
    status: { type: String, default: 'Completed' }
}, { timestamps: true });

const SecondaryPSTestModel = mongoose.model('SecondaryPSTest', SecondaryPSTestSchema);

module.exports = { SecondaryPSTestModel };

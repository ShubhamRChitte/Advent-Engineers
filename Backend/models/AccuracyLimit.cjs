const mongoose = require('mongoose');

const accuracyLimitSchema = new mongoose.Schema({
    transformerType: {
        type: String,
        enum: ['CT', 'PT'],
        default: 'CT',
        required: true
    },
    coreType: {
        type: String,
        enum: ['metering', 'protection', 'ps'],
        required: true,
    },
    // For metering
    accuracyClass: {
        type: String,
        // e.g. '0.1', '0.2', '0.5', '1', '3', '5', '0.2S', '0.5S'
    },
    limits: [{
        load: String, // e.g. '120%', '100%', '20%', '5%', '1%', '50%'
        ratioLimit: Number,
        phaseLimit: Number, // can be null for class 3 & 5
    }],

    // For protection
    protectionClass: {
        type: String,
        // e.g. '5P', '10P', '15P'
    },
    maxCurrentError: Number,
    maxPhaseError: Number, // can be null for 10P and 15P
    maxCompositeError: Number,

    // For PS
    // Using single documents for PS since there's typically only one set of rules, 
    // but we'll structure it so it can be expanded if needed.
    psRatioErrorLimit: Number, // e.g. 0.25 (for +/- 0.25)
    psExcitationMultiplier: Number, // e.g. 1.5 (for IexVk * 1.5 <= Iex11Vk)

}, { timestamps: true });

// Ensure uniqueness based on transformerType, type and class
accuracyLimitSchema.index({ transformerType: 1, coreType: 1, accuracyClass: 1 }, { unique: true, partialFilterExpression: { coreType: 'metering' } });
accuracyLimitSchema.index({ transformerType: 1, coreType: 1, protectionClass: 1 }, { unique: true, partialFilterExpression: { coreType: 'protection' } });
accuracyLimitSchema.index({ transformerType: 1, coreType: 1 }, { unique: true, partialFilterExpression: { coreType: 'ps' } });

module.exports = mongoose.model('AccuracyLimit', accuracyLimitSchema);

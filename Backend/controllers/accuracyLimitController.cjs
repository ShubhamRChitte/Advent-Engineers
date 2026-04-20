const AccuracyLimit = require('../models/AccuracyLimit.cjs');

// GET all limits
exports.getAllLimits = async (req, res) => {
    try {
        const limits = await AccuracyLimit.find();
        res.json(limits);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET limits by core type
exports.getLimitsByCoreType = async (req, res) => {
    try {
        const { coreType } = req.params;
        const { transformerType } = req.query;

        let query = { coreType };
        if (transformerType) {
            query.transformerType = transformerType;
        }

        const limits = await AccuracyLimit.find(query);
        res.json(limits);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST create or update limit (UPSERT)
exports.upsertLimit = async (req, res) => {
    try {
        const { transformerType, coreType, accuracyClass, protectionClass, limits, maxCurrentError, maxPhaseError, maxCompositeError, psRatioErrorLimit, psExcitationMultiplier } = req.body;

        let query = { coreType, transformerType: transformerType || 'CT' };
        if (coreType === 'metering') {
            query.accuracyClass = accuracyClass;
        } else if (coreType === 'protection') {
            query.protectionClass = protectionClass;
        }
        // ps only has one type so query is just { coreType: 'ps' }

        let updateData = { coreType, transformerType: transformerType || 'CT' };

        if (coreType === 'metering') {
            updateData.accuracyClass = accuracyClass;
            updateData.limits = limits;
        } else if (coreType === 'protection') {
            updateData.protectionClass = protectionClass;
            updateData.maxCurrentError = maxCurrentError;
            updateData.maxPhaseError = maxPhaseError;
            updateData.maxCompositeError = maxCompositeError;
        } else if (coreType === 'ps') {
            updateData.psRatioErrorLimit = psRatioErrorLimit;
            updateData.psExcitationMultiplier = psExcitationMultiplier;
        }

        const limit = await AccuracyLimit.findOneAndUpdate(
            query,
            updateData,
            { new: true, upsert: true }
        );

        res.status(200).json(limit);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// DELETE limit
exports.deleteLimit = async (req, res) => {
    try {
        const { id } = req.params;
        await AccuracyLimit.findByIdAndDelete(id);
        res.json({ message: 'Limit deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

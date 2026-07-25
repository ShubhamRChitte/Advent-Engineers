const { SettingsModel } = require('../models/SettingsModel');

/**
 * Helper to construct an ID string from dynamic flowchart pattern blocks.
 */
function buildIdFromBlocks(blocks, seqNum, defaultPrefix = "", defaultPadLen = 3, metadata = {}) {
    if (!Array.isArray(blocks) || blocks.length === 0) {
        const formattedSeq = String(seqNum).padStart(defaultPadLen, '0');
        return `${defaultPrefix}${formattedSeq}`;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const shortYear = String(currentYear).slice(-2);
    const monthNum = String(now.getMonth() + 1).padStart(2, '0');
    const monthShortNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthFullNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthShort = monthShortNames[now.getMonth()];
    const monthFull = monthFullNames[now.getMonth()];
    const dayStr = String(now.getDate()).padStart(2, '0');

    let result = '';
    for (const block of blocks) {
        if (!block || !block.type) continue;
        switch (block.type) {
            case 'prefix':
            case 'static':
            case 'text':
                result += (block.value !== undefined && block.value !== null) ? String(block.value) : '';
                break;

            case 'separator':
                result += (block.value !== undefined && block.value !== null) ? String(block.value) : '-';
                break;

            case 'year':
                if (block.format === 'YY') {
                    result += shortYear;
                } else {
                    result += String(currentYear);
                }
                break;

            case 'month':
                if (block.format === 'Mon') {
                    result += monthShort;
                } else if (block.format === 'Full') {
                    result += monthFull;
                } else {
                    result += monthNum;
                }
                break;

            case 'day':
                result += dayStr;
                break;

            case 'sequence':
            case 'counter':
                const pad = parseInt(block.padLength) || parseInt(defaultPadLen) || 3;
                result += String(seqNum).padStart(pad, '0');
                break;

            case 'jobRef':
                result += metadata.jobNumber || 'JOB-001';
                break;

            case 'coreType':
                let coreCode = block.meteringCode !== undefined ? block.meteringCode : (block.value || 'M');

                if (metadata.coreType) {
                    const cTypeUpper = String(metadata.coreType).toUpperCase();
                    if (cTypeUpper.includes('METER') || cTypeUpper === 'M' || cTypeUpper === 'MTR') {
                        coreCode = block.meteringCode !== undefined ? block.meteringCode : 'M';
                    } else if (cTypeUpper.includes('PS')) {
                        coreCode = block.psCode !== undefined ? block.psCode : 'PS';
                    } else if (cTypeUpper.includes('PROTECT') || cTypeUpper === 'P' || cTypeUpper === 'PRT') {
                        coreCode = block.protectionCode !== undefined ? block.protectionCode : 'P';
                    } else {
                        coreCode = String(metadata.coreType).slice(0, 3).toUpperCase();
                    }
                }
                result += coreCode;
                break;

            default:
                if (block.value) result += String(block.value);
                break;
        }
    }

    return result;
}

/**
 * Atomically gets the next ID for a given type if global settings are enabled.
 * @param {string} type - 'orderId', 'transformerId', 'preTestBatchId', 'preTestCoreId'
 * @param {Object} metadata - Optional context (e.g. { jobNumber, coreType })
 * @returns {Promise<string|null>} - Returns the generated ID string, or null if disabled
 */
async function checkIdExists(type, candidateId) {
    if (!candidateId) return false;
    try {
        const { PreTestBatchModel } = require('../models/PreTestBatchModel');
        const ReadyTransformer = require('../models/ReadyTransformerModel');
        const Order = require('../models/OrderModel');

        if (type === 'preTestBatchId') {
            const batch = await PreTestBatchModel.findOne({ batchId: candidateId }).lean();
            return !!batch;
        }
        if (type === 'preTestCoreId') {
            const inBatch = await PreTestBatchModel.findOne({ 'readings.internalCoreNo': candidateId }).lean();
            if (inBatch) return true;
            const inReady = await ReadyTransformer.findOne({ coreId: candidateId }).lean();
            return !!inReady;
        }
        if (type === 'orderId') {
            const ord = await Order.findOne({ orderId: candidateId }).lean();
            return !!ord;
        }
        if (type === 'transformerId') {
            const inOrd = await Order.findOne({ 'transformers.transformerId': candidateId }).lean();
            return !!inOrd;
        }
    } catch (err) {
        console.error("Error checking ID uniqueness:", err);
    }
    return false;
}

async function getNextGlobalId(type, metadata = {}) {
    let settings = await SettingsModel.findOne({ key: 'id_generation_settings' });
    if (!settings || !settings.value || !settings.value[type]) return null;

    let currentSeqNum = parseInt(settings.value[type].lastSequence, 10) || 0;
    let candidateId = null;
    let attempts = 0;

    while (attempts < 100) {
        attempts++;
        currentSeqNum++;

        const updated = await SettingsModel.findOneAndUpdate(
            { key: 'id_generation_settings' },
            { 
                $set: { 
                    [`value.${type}.lastSequence`]: currentSeqNum,
                    [`value.${type}.enabled`]: true
                } 
            },
            { new: true }
        );

        const config = updated.value[type];
        candidateId = buildIdFromBlocks(config.patternBlocks, currentSeqNum, config.prefix, config.padLength, metadata);

        const exists = await checkIdExists(type, candidateId);
        if (!exists) {
            return candidateId;
        }
    }

    return candidateId;
}

/**
 * Atomically gets multiple sequential IDs for a given type with duplicate skip checks.
 */
async function getMultipleNextGlobalIds(type, count, metadata = {}) {
    let settings = await SettingsModel.findOne({ key: 'id_generation_settings' });
    if (!settings || !settings.value || !settings.value[type]) return null;

    const ids = [];
    for (let i = 0; i < count; i++) {
        const uniqueId = await getNextGlobalId(type, metadata);
        if (uniqueId) {
            ids.push(uniqueId);
        }
    }

    return ids.length === count ? ids : null;
}

module.exports = {
    getNextGlobalId,
    getMultipleNextGlobalIds,
    buildIdFromBlocks
};

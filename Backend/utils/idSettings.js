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
                let coreCode = 'M';
                if (metadata.coreType) {
                    const cTypeUpper = String(metadata.coreType).toUpperCase();
                    if (cTypeUpper.includes('METER') || cTypeUpper === 'M' || cTypeUpper === 'MTR') {
                        coreCode = 'M';
                    } else if (cTypeUpper.includes('PS')) {
                        coreCode = 'PS';
                    } else if (cTypeUpper.includes('PROTECT') || cTypeUpper === 'P' || cTypeUpper === 'PRT') {
                        coreCode = 'P';
                    } else {
                        coreCode = String(metadata.coreType).slice(0, 3).toUpperCase();
                    }
                } else if (block.value) {
                    coreCode = block.value;
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
async function getNextGlobalId(type, metadata = {}) {
    // 1. Fetch current settings to check if enabled
    let settings = await SettingsModel.findOne({ key: 'id_generation_settings' });
    
    // If not found or not enabled for this type, return null
    if (!settings || !settings.value || !settings.value[type] || !settings.value[type].enabled) {
        return null;
    }

    // 2. Atomically increment the sequence number
    const updated = await SettingsModel.findOneAndUpdate(
        { key: 'id_generation_settings' },
        { $inc: { [`value.${type}.lastSequence`]: 1 } },
        { new: true }
    );

    const config = updated.value[type];
    const seqNum = config.lastSequence || 1;

    return buildIdFromBlocks(config.patternBlocks, seqNum, config.prefix, config.padLength, metadata);
}

/**
 * Atomically gets multiple sequential IDs for a given type.
 * @param {string} type 
 * @param {number} count 
 * @param {Object} metadata
 * @returns {Promise<string[]|null>}
 */
async function getMultipleNextGlobalIds(type, count, metadata = {}) {
    let settings = await SettingsModel.findOne({ key: 'id_generation_settings' });
    
    if (!settings || !settings.value || !settings.value[type] || !settings.value[type].enabled) {
        return null;
    }

    // Atomically increment the sequence number by the required count
    const updated = await SettingsModel.findOneAndUpdate(
        { key: 'id_generation_settings' },
        { $inc: { [`value.${type}.lastSequence`]: count } },
        { new: true }
    );

    const config = updated.value[type];
    const finalSeqNum = config.lastSequence; // This is the highest sequence after increment
    const startSeqNum = finalSeqNum - count + 1;

    const ids = [];
    for (let i = 0; i < count; i++) {
        const seqNum = startSeqNum + i;
        ids.push(buildIdFromBlocks(config.patternBlocks, seqNum, config.prefix, config.padLength, metadata));
    }
    
    return ids;
}

module.exports = {
    getNextGlobalId,
    getMultipleNextGlobalIds,
    buildIdFromBlocks
};

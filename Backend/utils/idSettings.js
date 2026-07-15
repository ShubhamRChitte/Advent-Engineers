const { SettingsModel } = require('../models/SettingsModel');

/**
 * Atomically gets the next ID for a given type if global settings are enabled.
 * @param {string} type - 'orderId', 'transformerId', 'preTestBatchId', 'preTestCoreId'
 * @returns {Promise<string|null>} - Returns the generated ID string, or null if disabled
 */
async function getNextGlobalId(type) {
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
    
    // 3. Format the ID
    const prefix = config.prefix || "";
    const seqNum = config.lastSequence || 1;
    const padLen = config.padLength || 3;
    
    const formattedSeq = String(seqNum).padStart(padLen, '0');
    
    return `${prefix}${formattedSeq}`;
}

/**
 * Atomically gets multiple sequential IDs for a given type (useful when creating multiple transformers at once).
 * @param {string} type 
 * @param {number} count 
 * @returns {Promise<string[]|null>}
 */
async function getMultipleNextGlobalIds(type, count) {
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
    const prefix = config.prefix || "";
    const padLen = config.padLength || 3;
    const finalSeqNum = config.lastSequence; // This is the highest sequence after increment
    const startSeqNum = finalSeqNum - count + 1;

    const ids = [];
    for (let i = 0; i < count; i++) {
        const seqNum = startSeqNum + i;
        const formattedSeq = String(seqNum).padStart(padLen, '0');
        ids.push(`${prefix}${formattedSeq}`);
    }
    
    return ids;
}

module.exports = {
    getNextGlobalId,
    getMultipleNextGlobalIds
};

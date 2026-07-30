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

            case 'orderRef':
            case 'jobRef':
                const orderIdVal = metadata.orderId || metadata.jobId || metadata.jobNumber || '';
                let orderIdBlocksToUse = metadata.orderIdBlocks;

                if (orderIdVal && Array.isArray(block.selectedParts) && block.selectedParts.length > 0) {
                    let orderSeqNum = metadata.orderIdSeqNum;
                    if (!orderSeqNum && typeof orderIdVal === 'string') {
                        const seqMatch = orderIdVal.match(/\d+$/);
                        if (seqMatch) {
                            orderSeqNum = parseInt(seqMatch[0], 10);
                        }
                    }
                    if (!orderSeqNum) orderSeqNum = 1;

                    let extracted = '';
                    if (orderIdBlocksToUse && Array.isArray(orderIdBlocksToUse)) {
                        for (const oBlock of orderIdBlocksToUse) {
                            if (!oBlock || !oBlock.id) continue;
                            if (block.selectedParts.includes(oBlock.id)) {
                                const partVal = buildIdFromBlocks([oBlock], orderSeqNum, '', 3, metadata);
                                extracted += partVal;
                            }
                        }
                    }
                    
                    // Fallback: If orderIdBlocksToUse didn't extract or wasn't provided, parse orderIdVal directly
                    if (!extracted && typeof orderIdVal === 'string') {
                        const parts = orderIdVal.split('-');
                        const isSelected = (partId) => block.selectedParts.includes(partId);
                        let partsArr = [];
                        
                        if (isSelected('b-prefix') || isSelected('part-0')) partsArr.push(parts[0] ? parts[0] + '-' : '');
                        if (isSelected('b-year') || isSelected('part-1')) partsArr.push(parts.length > 1 ? parts[1] : '');
                        if (isSelected('b-sep') || isSelected('part-2')) partsArr.push('-');
                        if (isSelected('b-seq') || isSelected('part-3')) partsArr.push(parts.length > 0 ? parts[parts.length - 1] : '');

                        extracted = partsArr.join('');
                    }

                    result += extracted || orderIdVal;
                } else {
                    result += orderIdVal || 'ORD-001';
                }
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

    const hasSeqBlock = blocks.some(b => b && (b.type === 'sequence' || b.type === 'counter'));
    if (!hasSeqBlock && seqNum !== undefined && seqNum !== null && Number(seqNum) > 0) {
        const pad = parseInt(defaultPadLen) || 3;
        const separator = result.endsWith('-') ? '' : '-';
        result += `${separator}${String(seqNum).padStart(pad, '0')}`;
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
        const { OrderModel } = require('../models/OrderModel');
        const { TransformerModel } = require('../models/TransformerModel');
        const { FailedCoreModel } = require('../models/FailedCoreModel');
        const { FailedTransformerModel } = require('../models/FailedTransformerModel');

        if (type === 'preTestBatchId') {
            const batch = await PreTestBatchModel.findOne({ batchId: candidateId }).lean();
            return !!batch;
        }
        if (type === 'preTestCoreId') {
            const inBatch = await PreTestBatchModel.findOne({ 'readings.internalCoreNo': candidateId }).lean();
            if (inBatch) return true;
            const inReady = await ReadyTransformer.findOne({ coreId: candidateId }).lean();
            if (inReady) return true;
            const inFailed = await FailedCoreModel.findOne({ coreId: candidateId }).lean();
            if (inFailed) return true;
            const inTr = await TransformerModel.findOne({ 
                $or: [
                    { meteringCoreId: candidateId },
                    { protectionCoreId: candidateId },
                    { psCoreId: candidateId }
                ] 
            }).lean();
            if (inTr) return true;
        }
        if (type === 'orderId') {
            const ord = await OrderModel.findOne({ $or: [{ jobId: candidateId }, { orderId: candidateId }] }).lean();
            return !!ord;
        }
        if (type === 'transformerId') {
            const tr = await TransformerModel.findOne({ uniqueId: candidateId }).lean();
            if (tr) return true;
            const ready = await ReadyTransformer.findOne({ transformerId: candidateId }).lean();
            if (ready) return true;
            const failed = await FailedTransformerModel.findOne({ uniqueId: candidateId }).lean();
            return !!failed;
        }
    } catch (err) {
        console.error("Error checking ID uniqueness:", err);
    }
    return false;
}

async function getNextGlobalId(type, metadata = {}) {
    let settings = await SettingsModel.findOne({ key: 'id_generation_settings' });
    if (!settings || !settings.value || !settings.value[type]) return null;

    if (settings.value.orderId && Array.isArray(settings.value.orderId.patternBlocks) && !metadata.orderIdBlocks) {
        metadata.orderIdBlocks = settings.value.orderId.patternBlocks;
    }

    const config = settings.value[type];
    const hasOrderWise = Array.isArray(config.patternBlocks) && config.patternBlocks.some(b => b && (b.type === 'orderRef' || b.type === 'jobRef') && b.useOrderWiseSequence === true);

    if ((hasOrderWise || type === 'transformerId') && metadata.unitIndex !== undefined) {
        let seq = metadata.unitIndex;
        let unitAttempts = 0;
        while (unitAttempts < 500) {
            const candidateId = buildIdFromBlocks(config.patternBlocks, seq, config.prefix, config.padLength, metadata);
            const exists = await checkIdExists(type, candidateId);
            const inBatch = metadata.batchSet && metadata.batchSet.has(candidateId);
            if (!exists && !inBatch) {
                if (metadata.batchSet) metadata.batchSet.add(candidateId);
                return candidateId;
            }
            seq++;
            unitAttempts++;
        }
    }

    const isPT = metadata.transformerType === 'PT' || (metadata.orderId && String(metadata.orderId).toUpperCase().includes('PT'));
    const seqKey = isPT ? 'lastSequencePT' : 'lastSequence';
    let currentSeqNum = parseInt(config[seqKey], 10) || 0;
    let candidateId = null;
    let attempts = 0;

    while (attempts < 500) {
        attempts++;
        currentSeqNum++;

        const updated = await SettingsModel.findOneAndUpdate(
            { key: 'id_generation_settings' },
            { 
                $set: { 
                    [`value.${type}.${seqKey}`]: currentSeqNum,
                    [`value.${type}.enabled`]: true
                } 
            },
            { new: true }
        );

        const currentConfig = updated.value[type];
        candidateId = buildIdFromBlocks(currentConfig.patternBlocks, currentSeqNum, currentConfig.prefix, currentConfig.padLength, metadata);

        const exists = await checkIdExists(type, candidateId);
        const inBatch = metadata.batchSet && metadata.batchSet.has(candidateId);
        if (!exists && !inBatch) {
            if (metadata.batchSet) metadata.batchSet.add(candidateId);
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
    const startIndex = metadata.startIndex || 0;
    const batchSet = metadata.batchSet || new Set();

    for (let i = 0; i < count; i++) {
        const itemMetadata = { ...metadata, unitIndex: startIndex + i + 1, batchSet };
        const uniqueId = await getNextGlobalId(type, itemMetadata);
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

const { getNextGlobalId } = require('./idSettings');

/**
 * Generates a Batch ID in the format: BATCH-DDMMYY-TYPE-SEQ
 * @param {string} coreType - 'Metering', 'Protection', or 'PS'
 * @param {number} dailyCount - Number of batches of this type already created today
 * @returns {Promise<string>}
 */
exports.generateBatchId = async (coreType, dailyCount) => {
  const globalBatchId = await getNextGlobalId('preTestBatchId');
  if (globalBatchId) return globalBatchId;

  const date = new Date();
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear().toString().slice(2);

  const typeCode =
    coreType === "Metering" ? "MTR" :
    coreType === "Protection" ? "PRT" :
    "PS";

  const sequence = String(dailyCount + 1).padStart(3, "0");
  return `BATCH-${dd}${mm}${yy}-${typeCode}-${sequence}`;
};

/**
 * Generates a Core ID linked to its Batch ID
 * @param {string} batchId - The parent Batch ID
 * @param {number} transformerNum - Sequence number of the core in the batch
 * @returns {Promise<string>}
 */
exports.generateCoreIdFromBatch = async (batchId, transformerNum) => {
  const globalCoreId = await getNextGlobalId('preTestCoreId');
  if (globalCoreId) return globalCoreId;

  const parts = batchId.split('-');
  
  if (parts.length >= 4) {
    const datePart = parts[1];
    const typePart = parts[2];
    const batchSeq = parts[3].slice(-2); // Use last 2 digits of batch sequence
    return `PRE-${datePart}-${typePart}-${batchSeq}-${String(transformerNum).padStart(3, '0')}`;
  }

  // Fallback for old batch IDs
  const batchDigits = (batchId.match(/\d+/) || ['00'])[0].slice(-2).padStart(2, '0');
  const date = new Date();
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear().toString().slice(2);
  
  return `PRE-${dd}${mm}${yy}-B${batchDigits}-${String(transformerNum).padStart(3, '0')}`;
};

const { getMultipleNextGlobalIds } = require('./idSettings');
exports.generateMultipleCoreIdsFromBatch = async (batchId, count) => {
    const globalCoreIds = await getMultipleNextGlobalIds('preTestCoreId', count);
    if (globalCoreIds && globalCoreIds.length === count) return globalCoreIds;
    
    // If not global, generate manually
    const ids = [];
    for(let i=1; i<=count; i++){
        ids.push(await exports.generateCoreIdFromBatch(batchId, i)); // Fallback internally uses old logic
    }
    return ids;
};

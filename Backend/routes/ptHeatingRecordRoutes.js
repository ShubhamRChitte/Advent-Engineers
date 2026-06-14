const express = require('express');
const router = express.Router();
const TransformerModel = require('../models/TransformerModel');

const { isAuthenticated } = require('../middlewares/authMiddleware');

// POST endpoint to save or update PT heating records
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { records } = req.body;
        
        if (!records || !Array.isArray(records)) {
            return res.status(400).json({ error: "Invalid data format. Expected 'records' array." });
        }

        // Processing records per transformer. Since the array objects might correlate to different items, we loop them or bulk update if matched on job No/ID
        let updatedCount = 0;

        for (const record of records) {
            // Because UI handles raw text inputs mapped to Job number, we find ANY transformer matching jobNo + PT + 33KV to anchor this record, or precisely by transformer ID if accurate. 
            // In typical cases UI might just pass the JobNumber and we tie it there.
            
            // To be robust and match existing CT heating behavior, we usually find a target and push to processHistory array
            let query = {};
            
            if (record.transformerId && record.transformerId !== 'UNKNOWN_TRANSFORMER_ID' && record.transformerId.length === 24) {
               query = { _id: record.transformerId };
            } else if (record.jobNumber) {
               query = { jobId: record.jobNumber, "processHistory": { $exists: true } };
            }

            if (Object.keys(query).length > 0) {
                 const transformer = await TransformerModel.findOne(query);
                 
                 if (transformer) {
                     // Ensure object structure exists
                     if (!transformer.processHistory) {
                         transformer.processHistory = { heatingRecord: [], ptHeatingRecord: [] };
                     }
                     if (!transformer.processHistory.ptHeatingRecord) {
                         transformer.processHistory.ptHeatingRecord = [];
                     }
                     
                     transformer.processHistory.ptHeatingRecord.push(record);
                     await transformer.save();
                     updatedCount++;
                 }
            }
        }

        res.status(200).json({ success: true, message: `Successfully saved ${updatedCount} PT heating records.` });
    } catch (error) {
        console.error("Error saving PT Heating Record:", error);
        res.status(500).json({ error: "Failed to save PT heating records.", details: error.message });
    }
});

// GET endpoint to fetch PT Heating records for a specific Job ID or Transformer ID
router.get('/:jobId', isAuthenticated, async (req, res) => {
    try {
        const { jobId } = req.params;
        const transformers = await TransformerModel.find({ jobId: jobId }).select('processHistory.ptHeatingRecord');
        
        if (!transformers || transformers.length === 0) {
            return res.status(404).json({ success: false, message: "No records found for this Job ID." });
        }
        
        let allRecords = [];
        transformers.forEach(t => {
            if (t.processHistory && t.processHistory.ptHeatingRecord) {
                allRecords.push(...t.processHistory.ptHeatingRecord);
            }
        });
        
        res.status(200).json({ success: true, data: allRecords });
    } catch (error) {
        console.error("Error fetching PT heating records:", error);
        res.status(500).json({ error: "Failed to fetch records.", details: error.message });
    }
});

module.exports = router;

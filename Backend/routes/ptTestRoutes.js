const express = require('express');
const router = express.Router();
const { TransformerModel } = require('../models/TransformerModel');
const { OrderModel } = require('../models/OrderModel');
const { FailedTransformerModel } = require('../models/FailedTransformerModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// POST /api/pt-tests/submit
// Submit a full PT Test Report for a specific transformer
router.post('/submit', isAuthenticated, async (req, res) => {
  try {
    const { transformerId, orderId, reportData } = req.body;
    
    if (!transformerId || !orderId || !reportData) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // 1. Find and update the Transformer
    const transformer = await TransformerModel.findById(transformerId);
    if (!transformer) {
      return res.status(404).json({ success: false, message: "Transformer not found." });
    }

    // Validate the transformer is actually a PT transformer (extra safety)
    if (transformer.currentStage !== 'pt') {
        return res.status(400).json({ success: false, message: "Transformer is not in PT testing stage." });
    }

    // Update the Transformer Document
    transformer.testHistory.pt_test = reportData;
    transformer.markModified('testHistory.pt_test'); // Required for Schema.Types.Mixed to save!
    transformer.currentStage = 'shipped'; // Or another stage if 'shipped' isn't appropriate, maybe 'completed'
    await transformer.save();

    // 2. Check Order Status
    // Find all transformers for this order to see if all are completed
    const allTransformers = await TransformerModel.find({ orderId: orderId });
    const allCompleted = allTransformers.every(t => t.testHistory && t.testHistory.pt_test && Object.keys(t.testHistory.pt_test).length > 0);

    // Update Order Model
    if (allCompleted) {
        await OrderModel.findByIdAndUpdate(orderId, {
            $set: { 
                status: 'PT Testing Completed', // Or 'Completed' based on your global status map
                'completionStages.pt': true,
                approved: true // Typically handled by an admin, but setting to true to make it show in history. Adjust if an admin step is needed.
            }
        });
    } else {
        await OrderModel.findByIdAndUpdate(orderId, {
            $set: { 
                status: 'PT Testing In Progress' 
            }
        });
    }

    res.status(200).json({ 
        success: true, 
        message: "PT Test Report submitted successfully.",
        allCompleted: allCompleted
    });

  } catch (err) {
    console.error("Error submitting PT Test:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/pt-tests/failed
// Log a failed PT transformer
router.post('/failed', isAuthenticated, async (req, res) => {
    try {
        const { transformerId, orderId, jobNumber, coreType, failureParameters, failureReason, reportedBy } = req.body;

        if (!transformerId || !orderId || !coreType || !failureReason || !reportedBy) {
            return res.status(400).json({ success: false, message: "Missing required fields for failure logging." });
        }

        const failedRecord = new FailedTransformerModel({
            transformerId,
            orderId,
            jobNumber,
            coreType,
            failureParameters,
            failureReason,
            reportedBy,
            stage: "PT_TESTING",
            status: "FAILED"
        });

        await failedRecord.save();

        // Optionally, update the transformer's stage or order status here if needed
        // For now, we just log the failure.

        res.status(201).json({
            success: true,
            message: "Failed PT Transformer logged successfully",
            data: failedRecord
        });
    } catch (error) {
        console.error("Error saving failed PT transformer:", error);
        
        // Handle duplicate entry gracefully
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "This core has already been marked as failed." });
        }
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// GET /api/pt-tests/reports
// Fetch all transformers that have PT test history
router.get('/reports', isAuthenticated, async (req, res) => {
    try {
        const query = {
            'testHistory.pt_test': { $exists: true, $ne: {} } // ensure it's not the default empty object
        };

        const transformers = await TransformerModel.find(query)
            .populate({
                path: 'orderId',
                match: { transformerType: 'PT' }, // Filter by PT Orders at population level
                select: 'clientName quantity deadline ratio accuracyClass burden voltageRating jobId'
            })
            .sort({ 'testHistory.pt_test.date': -1 });
            
        // Filter out docs where populate failed (wasn't a PT order) or where pt_test is logically empty
        const validTransformers = transformers.filter(t => 
             t.orderId !== null &&
             t.testHistory && 
             t.testHistory.pt_test && 
             Object.keys(t.testHistory.pt_test).length > 0
        );

        res.json(validTransformers);
    } catch (error) {
        console.error("Error fetching PT reports:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// GET /api/pt-tests/:transformerId
// Fetch existing PT test data for a transformer
router.get('/:transformerId', isAuthenticated, async (req, res) => {
    try {
        const { transformerId } = req.params;
        const transformer = await TransformerModel.findById(transformerId);
        
        if (!transformer) {
            return res.status(404).json({ success: false, message: "Transformer not found" });
        }

        res.status(200).json({
            success: true,
            data: transformer.testHistory?.pt_test || null
        });

    } catch (err) {
        console.error("Error fetching PT Test:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

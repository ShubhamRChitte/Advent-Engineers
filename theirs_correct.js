const express = require('express');
const router = express.Router();
const { TransformerModel } = require('../models/TransformerModel');
const { OrderModel } = require('../models/OrderModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// GET /api/heating-record/orders
// Returns orders where at least one transformer is ready for or in Heating
// Criteria: testHistory.primary_test.status === "Completed" AND currentStage in ["primary", "heating"]
router.get('/orders', isAuthenticated, async (req, res) => {
    try {
        const query = {
            "testHistory.primary_test.status": "Completed",
            currentStage: { $in: ["primary", "heating"] }
        };

        const transformers = await TransformerModel.find(query).populate('orderId').lean();
        
        // Group by order
        const ordersMap = new Map();
        for (const t of transformers) {
            if (t.orderId && !ordersMap.has(t.orderId._id.toString())) {
                ordersMap.set(t.orderId._id.toString(), t.orderId);
            }
        }

        const orders = Array.from(ordersMap.values());
        res.json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching heating orders:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/heating-record/transformers/:orderId
// Returns transformers for an order that are eligible for or have completed Heating
router.get('/transformers/:orderId', isAuthenticated, async (req, res) => {
    try {
        const { orderId } = req.params;
        const query = {
            orderId: orderId,
            "testHistory.primary_test.status": "Completed",
            currentStage: { $in: ["primary", "heating", "final", "shipped"] }
        };

        const transformers = await TransformerModel.find(query).lean();
        res.json({ success: true, transformers });
    } catch (error) {
        console.error("Error fetching heating transformers:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/heating-record/completed
// Returns orders where all heating records are finished (transformers in final/shipped stages)
router.get('/completed', isAuthenticated, async (req, res) => {
    try {
        const query = {
            currentStage: { $in: ["final", "shipped"] },
            "processHistory.heatingRecord.0": { $exists: true }
        };

        const transformers = await TransformerModel.find(query).populate('orderId').lean();
        
        const ordersMap = new Map();
        for (const t of transformers) {
            if (t.orderId && !ordersMap.has(t.orderId._id.toString())) {
                ordersMap.set(t.orderId._id.toString(), t.orderId);
            }
        }

        const orders = Array.from(ordersMap.values());
        res.json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching completed heating orders:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// START Heating Test
// PUT /api/heating-record/start/:uniqueId
router.put('/start/:uniqueId', isAuthenticated, async (req, res) => {
    try {
        const { uniqueId } = req.params;
        const transformer = await TransformerModel.findOne({ uniqueId });

        if (!transformer) return res.status(404).json({ success: false, message: "Transformer not found" });

        transformer.currentStage = "heating";
        
        // Ensure heatingRecord exists
        if (!transformer.processHistory) {
            transformer.processHistory = {};
        }
        if (!transformer.processHistory.heatingRecord || transformer.processHistory.heatingRecord.length === 0) {
            transformer.processHistory.heatingRecord = [{
                transformerId: transformer._id,
                jobNumber: transformer.jobId,
                status: "In Progress",
                processSteps: [],
                recordedBy: req.user.name || req.user.fullName
            }];
        } else {
            transformer.processHistory.heatingRecord[0].status = "In Progress";
        }

        await transformer.save();
        res.json({ success: true, message: "Heating started." });
    } catch (error) {
        console.error("Error starting heating:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// SAVE Heating Test
// POST /api/heating-record/save/:uniqueId
router.post('/save/:uniqueId', isAuthenticated, async (req, res) => {
    try {
        const { uniqueId } = req.params;
        const { processSteps, preparedBy, verifiedBy, productionManager, isApproveCall } = req.body;
        
        const transformer = await TransformerModel.findOne({ uniqueId });
        if (!transformer) return res.status(404).json({ success: false, message: "Transformer not found" });

        if (!transformer.processHistory || !transformer.processHistory.heatingRecord || transformer.processHistory.heatingRecord.length === 0) {
            return res.status(400).json({ success: false, message: "Heating record not started." });
        }

        let record = transformer.processHistory.heatingRecord[0];
        if (processSteps) record.processSteps = processSteps;
        if (preparedBy) record.preparedBy = preparedBy;
        if (verifiedBy) record.verifiedBy = verifiedBy;
        if (productionManager) record.productionManager = productionManager;

        if (isApproveCall) {
            record.status = "Approved";
            transformer.currentStage = "final";
        } else {
            record.status = "Completed";
        }

        console.log(`[DEBUG] Saving Heating Record for ${uniqueId}. Payload processSteps count: ${processSteps?.length}`);
        
        transformer.markModified('processHistory.heatingRecord');
        await transformer.save();

        res.json({ success: true, message: isApproveCall ? "Heating approved." : "Heating saved successfully." });
    } catch (error) {
        console.error(`[ERROR] Save Heating Record failed for ${req.params.uniqueId}:`, error);
        res.status(500).json({ success: false, message: "Server error during save", error: error.message });
    }
});

module.exports = router;

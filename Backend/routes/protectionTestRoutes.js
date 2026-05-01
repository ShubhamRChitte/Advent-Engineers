// routes/protectionTestRoutes.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ProtectionCoreTestModel } = require('../models/ProtectionCoreTestModel');
const { OrderModel } = require('../models/OrderModel');
const { TransformerModel } = require('../models/TransformerModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

const { buildTestQuery, saveTestResults } = require('../utils/testAutomation');

// GET existing data (Secure)
router.get('/protection-tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // "Protection" or "PS"
    
    if (!type) {
      return res.status(400).json({ success: false, message: "Core type (Protection/PS) is required" });
    }

    const query = buildTestQuery({ id, coreType: type });

    // Validate ObjectId if not a batch
    if (!query.batchId && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Order ID" });
    }

    const data = await ProtectionCoreTestModel.findOne(query);
    res.status(200).json(data || null);
  } catch (err) {
    console.error("GET Protection Error:", err);
    res.status(500).json({ success: false, message: "Error fetching existing records", error: err.message });
  }
});

router.post('/protection-tests', isAuthenticated, async (req, res) => {
  try {
    const { orderId, isPreTest, batchId, coreType } = req.body;

    // 1. Validation
    if (!isPreTest && !orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required for standard testing." });
    }
    if (isPreTest && !batchId) {
      return res.status(400).json({ success: false, message: "Batch ID is required for pre-testing." });
    }

    const query = buildTestQuery({ orderId, batchId, isPreTest, coreType: coreType || "Protection" });

    // 2. Call shared service
    const testRecord = await saveTestResults({
      Model: ProtectionCoreTestModel,
      query,
      payload: req.body,
      user: req.user
    });

    // 3. Status Update
    if (!isPreTest && orderId) {
      await OrderModel.findByIdAndUpdate(orderId, { $set: { status: `${coreType} Testing In Progress` } });
    }

    res.status(201).json({ success: true, data: testRecord, message: "Testing data saved successfully." });

  } catch (err) {
    console.error("SAVE Protection Error:", err);
    res.status(500).json({ success: false, message: "Internal server error during save.", error: err.message });
  }
});

module.exports = router;
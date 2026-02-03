// routes/protectionTestRoutes.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ProtectionCoreTestModel } = require('../models/ProtectionCoreTestModel');
const { OrderModel } = require('../models/OrderModel');

// Path becomes: POST /api/protection-tests
// GET existing data (Secure)
router.get('/protection-tests/:orderId', async (req, res) => {
  try {
    // Protection or PS both use this model/route, so we don't hardcode coreType="Metering"
    // BUT we must check if the requested data matches the protection model.
    // The frontend sends specific requests.
    const { type } = req.query;
    const query = { orderId: req.params.orderId };

    // If type is provided, filter by it. Otherwise it might return the first match (which caused the bug)
    if (type) {
      query.coreType = type;
    }

    const data = await ProtectionCoreTestModel.findOne(query);
    res.status(200).json(data || null);
  } catch (err) {
    res.status(500).json({ message: "Error fetching existing records", error: err.message });
  }
});

router.post('/protection-tests', async (req, res) => {
  try {
    const { orderId, coreType } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid Parent Order ID' });
    }

    // Use findOneAndUpdate with upsert: true
    const testRecord = await ProtectionCoreTestModel.findOneAndUpdate(
      { orderId: orderId, coreType: coreType },
      req.body,
      { upsert: true, new: true, runValidators: true }
    );

    await OrderModel.findByIdAndUpdate(orderId, {
      $set: { status: `${coreType} Testing Completed` }
    });

    res.status(201).json({ success: true, id: testRecord._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
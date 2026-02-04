// routes/meteringTest.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { MeteringCoreTestModel } = require('../models/MeteringCoreTestModel');
const { OrderModel } = require('../models/OrderModel');


// --- ADD THIS GET ROUTE HERE ---
// This allows the frontend to fetch previously saved data using the Order ID
// --- ADD THIS GET ROUTE HERE ---
// This allows the frontend to fetch previously saved data using the Order ID.
// Secure: Filters by both orderId AND coreType.
router.get('/metering-tests/:orderId', async (req, res) => {
  try {
    const data = await MeteringCoreTestModel.findOne({
      orderId: req.params.orderId,
      coreType: "Metering" // Explicitly check type
    });

    // Always return an object or null
    res.status(200).json(data || null);
  } catch (err) {
    res.status(500).json({ message: "Error fetching existing records", error: err.message });
  }
});


// Example for Metering (Apply same logic to Protection)
router.post('/metering-tests', async (req, res) => {
  try {
    const { orderId, coreType } = req.body;

    // Use findOneAndUpdate with upsert: true
    // This finds the existing report for this order/type and UPDATES it.
    const testRecord = await MeteringCoreTestModel.findOneAndUpdate(
      { orderId: orderId, coreType: coreType },
      req.body,
      { upsert: true, new: true, runValidators: true }
    );

    // Update parent order status
    await OrderModel.findByIdAndUpdate(orderId, {
      $set: { status: "Core Testing In Progress" }
    });

    res.status(200).json({ success: true, data: testRecord });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


module.exports = router;
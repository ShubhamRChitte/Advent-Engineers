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
    const { orderId, coreType, readings, ...otherData } = req.body;

    // 1. Check if document exists
    let testRecord = await MeteringCoreTestModel.findOne({ orderId, coreType });

    if (testRecord) {
      // 2. MERGE LOGIC
      // Update non-array fields (header info)
      Object.assign(testRecord, otherData);

      // Merge readings: Append new ones, or update if we can identify duplicates (based on internalCoreNo)
      // For simplicity and safety in this context, we'll append new readings that don't match existing internalCoreNo
      // OR better: Replace readings for specific cores if they exist, add if they don't.

      const existingReadings = testRecord.readings || [];
      const incomingReadings = readings || [];

      const mergedReadings = [...existingReadings];

      incomingReadings.forEach(newReading => {
        const index = mergedReadings.findIndex(r => r.internalCoreNo === newReading.internalCoreNo);
        if (index > -1) {
          // Update existing reading
          mergedReadings[index] = newReading;
        } else {
          // Add new reading
          mergedReadings.push(newReading);
        }
      });

      testRecord.readings = mergedReadings;
      await testRecord.save();

    } else {
      // 3. Create New
      testRecord = new MeteringCoreTestModel(req.body);
      await testRecord.save();
    }

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
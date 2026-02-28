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

    // 0. Auto-assign status based on pass/fail and prepare for lock check
    const processedReadings = (readings || []).map(r => ({
      ...r,
      status: r.status || (r.result === "F" ? "FAIL" : (r.result === "P" ? "PASS" : "PENDING"))
    }));

    // 1. Check if document exists
    let testRecord = await MeteringCoreTestModel.findOne({ orderId, coreType });

    if (testRecord) {
      // 2. MERGE LOGIC
      // Update non-array fields (header info)
      Object.assign(testRecord, otherData);

      const existingReadings = testRecord.readings || [];
      const mergedReadings = [...existingReadings];

      processedReadings.forEach(newReading => {
        const index = mergedReadings.findIndex(r => r.internalCoreNo === newReading.internalCoreNo);
        if (index > -1) {
          // LOCK MECHANISM: Prevent modifying already FAILED or RETURNED cores
          if (mergedReadings[index].status === "FAIL" || mergedReadings[index].status === "RETURNED") {
            return; // Skip update for this specific core
          }
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
      testRecord = new MeteringCoreTestModel({ orderId, coreType, readings: processedReadings, ...otherData });
      await testRecord.save();
    }

    // Update parent order status
    await OrderModel.findByIdAndUpdate(orderId, {
      $set: { status: "Core Testing In Progress" }
    });

    // AUTO-CREATE FAILED CORES
    const failedCoreService = require('../services/failedCoreService');
    const failedReadings = processedReadings.filter(r => r.result === "F" && r.status === "FAIL");
    for (const r of failedReadings) {
      try {
        await failedCoreService.recordFailure(orderId, r.internalCoreNo, {
          failureReason: "Failed during Metering Core Testing limits check",
          failureStage: "INITIAL_TEST",
          dynamicValues: r.measuredMa
        });
      } catch (err) {
        console.error(`Error recording failed core ${r.internalCoreNo}:`, err.message);
      }
    }

    res.status(200).json({ success: true, data: testRecord });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


module.exports = router;
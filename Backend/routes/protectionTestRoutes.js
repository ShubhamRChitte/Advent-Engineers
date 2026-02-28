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
    const { orderId, coreType, readings, ...otherData } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid Parent Order ID' });
    }

    // 0. Auto-assign status based on pass/fail and prepare for lock check
    const processedReadings = (readings || []).map(r => ({
      ...r,
      status: r.status || (r.result === "F" ? "FAIL" : (r.result === "P" ? "PASS" : "PENDING"))
    }));

    // 1. Check if document exists
    let testRecord = await ProtectionCoreTestModel.findOne({ orderId, coreType });

    if (testRecord) {
      // 2. MERGE LOGIC
      // Update header info
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
          mergedReadings[index] = newReading;
        } else {
          mergedReadings.push(newReading);
        }
      });

      testRecord.readings = mergedReadings;
      await testRecord.save();
    } else {
      // 3. Create New
      testRecord = new ProtectionCoreTestModel({ orderId, coreType, readings: processedReadings, ...otherData });
      await testRecord.save();
    }

    await OrderModel.findByIdAndUpdate(orderId, {
      $set: { status: `${coreType} Testing Completed` }
    });

    // AUTO-CREATE FAILED CORES
    const failedCoreService = require('../services/failedCoreService');
    const failedReadings = processedReadings.filter(r => r.result === "F" && r.status === "FAIL");
    for (const r of failedReadings) {
      try {
        await failedCoreService.recordFailure(orderId, r.internalCoreNo, {
          failureReason: `Failed during ${coreType} Core Testing limits check`,
          failureStage: "INITIAL_TEST",
          dynamicValues: r.value ? { value: r.value } : {}
        });
      } catch (err) {
        console.error(`Error recording failed core ${r.internalCoreNo}:`, err.message);
      }
    }

    res.status(201).json({ success: true, id: testRecord._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
// routes/meteringTest.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { LocalString } = require('mongoose');
const { MeteringCoreTestModel } = require('../models/MeteringCoreTestModel');
const { SecondaryMeteringTestModel } = require('../models/SecondaryMeteringTestModel');
const { TransformerModel } = require('../models/TransformerModel');
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


// --- SECONDARY METERING TESTS ---

// POST /api/secondary-metering-tests
// Saves secondary metering test results and updates Transformer status
router.post('/secondary-metering-tests', async (req, res) => {
  try {
    const { uniqueId, loginType, tester, coreId, metering_results } = req.body;

    if (!uniqueId || !metering_results) {
      return res.status(400).json({ success: false, message: "Missing required fields (uniqueId, metering_results)" });
    }

    console.log(`[Secondary Metering] Saving report for ${uniqueId} by ${tester}`);

    // 1. Check if a report already exists for this Transformer + Core combo?
    // Actually, secondary tests might cover multiple cores or be saved iteratively.
    // The Model structure seems to store an array of results or similar. 
    // Based on the Frontend Payload: it sends `metering_results` which is an array of objects (one per ratio).

    // We will upsert based on uniqueId (Transformer ID).
    // If the schema supports arrays of tests, we might push. 
    // But usually for "Report", we overwrite or merge.

    // Let's look at the usage. The frontend sends the full result set for a core.
    // We'll create a new document for this test session.

    // Wait, SecondaryMeteringTestModel usually needs to link to the Transformer.
    // Let's assume one document per test record (or per transformer?).
    // If we want to support multiple tests (re-tests), we create new.

    // Create new test record
    const newTest = new SecondaryMeteringTestModel({
      uniqueId,
      tester,
      coreId, // Store which core this specific test block is for (optional, good for granular queries)
      metering_results,
      testDate: new Date(),
      status: "Completed" // Explicitly marking this test record as completed
    });

    const savedTest = await newTest.save();

    // 2. Update Transformer History Status
    // This is CRITICAL for "My Reports" to work.

    // Find the transformer
    const transformer = await TransformerModel.findOne({ uniqueId });
    if (transformer) {
      // Ensure structure exists
      if (!transformer.testHistory) transformer.testHistory = {};
      if (!transformer.testHistory.secondary_test) transformer.testHistory.secondary_test = {};

      // Update status and tester
      transformer.testHistory.secondary_test.status = "Completed";
      transformer.testHistory.secondary_test.tester = tester;
      transformer.testHistory.secondary_test.timestamp = new Date();

      // Optionally, we can save the test ID implicitly or just rely on query by uniqueId
      // transformer.testHistory.secondary_test.lastTestId = savedTest._id;

      await transformer.save();
      console.log(`[Secondary Metering] Updated Transformer ${uniqueId} status to Completed.`);
    } else {
      console.warn(`[Secondary Metering] Transformer ${uniqueId} not found while saving test!`);
    }

    res.status(200).json({ success: true, data: savedTest, message: "Report saved and status updated" });

  } catch (err) {
    console.error("Error saving secondary metering test:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


const { SecondaryPSTestModel } = require('../models/SecondaryPSTestModel');
const { SecondaryProtectionTestModel } = require('../models/SecondaryProtectionTestModel');


// POST /api/secondary-ps-tests
router.post('/secondary-ps-tests', async (req, res) => {
  try {
    const { uniqueId, tester, coreId, ps_results } = req.body;

    if (!uniqueId || !ps_results) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newTest = new SecondaryPSTestModel({
      uniqueId,
      tester,
      coreId,
      ps_results,
      status: "Completed"
    });

    const savedTest = await newTest.save();

    // Update Transformer History
    const transformer = await TransformerModel.findOne({ uniqueId });
    if (transformer) {
      if (!transformer.testHistory) transformer.testHistory = {};
      if (!transformer.testHistory.secondary_test) transformer.testHistory.secondary_test = {};

      // Update status if not already (though partially complete applies per core)
      // We'll mark the overall stage as In Progress or rely on manual approval?
      // Actually, the request is to "mark status" similarly.
      // But usually completion is checked differently. 
      // IMPORTANT: We need to SAVE these results into the transformer document too so they can be re-loaded!
      // The previous logic for Metering didn't explicitly save RESULTS to transformer, just status.
      // BUT `SecondaryPSReport` tries to LOAD from `transformer.testHistory.secondary_test.ps_results`.

      // So we MUST push/update results in the transformer model.

      // Initialize array if missing
      if (!transformer.testHistory.secondary_test.ps_results) {
        transformer.testHistory.secondary_test.ps_results = [];
      }

      // Remove old results for this coreId to avoid duplicates (replace logic)
      transformer.testHistory.secondary_test.ps_results = transformer.testHistory.secondary_test.ps_results.filter(
        r => r.internalCoreNo !== coreId && r.coreId !== coreId
      );

      // Add new results
      transformer.testHistory.secondary_test.ps_results.push(...ps_results);

      // We only mark stage "Completed" when ALL done? 
      // Or we just update "tester" info.
      // If this is the active test, let's update tester name.
      transformer.testHistory.secondary_test.tester = tester;
      transformer.testHistory.secondary_test.timestamp = new Date();
      // We explicitly mark stage as Completed for "My Reports" visibility
      transformer.testHistory.secondary_test.status = "Completed";

      await transformer.save();
    }

    res.status(200).json({ success: true, data: savedTest });
  } catch (err) {
    console.error("Error saving PS test:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/secondary-protection-tests
router.post('/secondary-protection-tests', async (req, res) => {
  try {
    const { uniqueId, tester, coreId, protection_results } = req.body;

    if (!uniqueId || !protection_results) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newTest = new SecondaryProtectionTestModel({
      uniqueId,
      tester,
      coreId,
      protection_results,
      status: "Completed"
    });

    const savedTest = await newTest.save();

    const transformer = await TransformerModel.findOne({ uniqueId });
    if (transformer) {
      if (!transformer.testHistory) transformer.testHistory = {};
      if (!transformer.testHistory.secondary_test) transformer.testHistory.secondary_test = {};

      if (!transformer.testHistory.secondary_test.protection_results) {
        transformer.testHistory.secondary_test.protection_results = [];
      }

      transformer.testHistory.secondary_test.protection_results = transformer.testHistory.secondary_test.protection_results.filter(
        r => r.internalCoreNo !== coreId && r.coreId !== coreId
      );

      transformer.testHistory.secondary_test.protection_results.push(...protection_results);

      transformer.testHistory.secondary_test.tester = tester;
      transformer.testHistory.secondary_test.timestamp = new Date();
      transformer.testHistory.secondary_test.status = "Completed";

      await transformer.save();
    }

    res.status(200).json({ success: true, data: savedTest });
  } catch (err) {
    console.error("Error saving Protection test:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


module.exports = router;
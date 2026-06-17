const express = require('express');
const router = express.Router();
const { TransformerModel } = require("../models/TransformerModel");
const { SecondaryMeteringTestModel } = require("../models/SecondaryMeteringTestModel");
const AccuracyLimit = require('../models/AccuracyLimit.cjs');

router.post("/transformer-primary-metering-tests", async (req, res) => {
  try {
    const { uniqueId, tester, metering_results, coreId } = req.body;
    console.log(`[DEBUG] POST /transformer-primary-metering-tests. Payload:`, req.body);

    // Fetch the Transformer to get Accuracy Class
    const transformerDoc = await TransformerModel.findOne({ uniqueId: uniqueId }).populate('orderId');
    if (!transformerDoc) {
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    const accuracyClass = transformerDoc.orderId ? transformerDoc.orderId.accuracyClass : "0.5";

    // Fetch dynamic limits from DB
    const dbLimits = await AccuracyLimit.find({ coreType: 'metering', transformerType: 'CT' }).lean();

    // Validate Readings
    const validatedResults = metering_results.map(resultBlock => {
      const coreAccuracyClass = resultBlock.accuracyClass || accuracyClass || "0.5";
      const cleanClass = String(coreAccuracyClass).toUpperCase().replace(/\s+/g, '');
      const limitConfig = dbLimits.find(l => {
        const lClass = l.accuracyClass ? String(l.accuracyClass).toUpperCase().replace(/\s+/g, '') : '';
        return lClass === cleanClass;
      });

      if (resultBlock.rows) {
        resultBlock.rows.forEach(row => {
          let rPass = true, pPass = true;
          const reasons = [];
          const loadLimit = limitConfig?.limits?.find(l => String(l.load) === String(row.current));

          if (row.r100 !== undefined && row.r100 !== null && String(row.r100).trim() !== '') {
            const rVal = parseFloat(row.r100);
            if (!isNaN(rVal) && loadLimit?.ratioLimit !== undefined) {
              if (Math.abs(rVal) >= loadLimit.ratioLimit) { rPass = false; reasons.push(`Ratio Error (${rVal}) exceeds ±${loadLimit.ratioLimit}`); }
            }
          }
          if (row.p100 !== undefined && row.p100 !== null && String(row.p100).trim() !== '') {
            const pVal = parseFloat(row.p100);
            if (!isNaN(pVal) && loadLimit?.phaseLimit !== undefined && loadLimit.phaseLimit !== null) {
              if (Math.abs(pVal) >= loadLimit.phaseLimit) { pPass = false; reasons.push(`Phase Error (${pVal}) exceeds ±${loadLimit.phaseLimit}`); }
            }
          }
          row.r100_r_pass = rPass; row.r100_p_pass = pPass; row.r100_pass = rPass && pPass;
          row.r100_reason = reasons.length > 0 ? reasons.join('; ') : null;

          let rPass25 = true, pPass25 = true;
          const reasons25 = [];
          if (row.r25 !== undefined && row.r25 !== null && String(row.r25).trim() !== '') {
            const rVal = parseFloat(row.r25);
            if (!isNaN(rVal) && loadLimit?.ratioLimit !== undefined) {
              if (Math.abs(rVal) >= loadLimit.ratioLimit) { rPass25 = false; reasons25.push(`Ratio Error (${rVal}) exceeds ±${loadLimit.ratioLimit}`); }
            }
          }
          if (row.p25 !== undefined && row.p25 !== null && String(row.p25).trim() !== '') {
            const pVal = parseFloat(row.p25);
            if (!isNaN(pVal) && loadLimit?.phaseLimit !== undefined && loadLimit.phaseLimit !== null) {
              if (Math.abs(pVal) >= loadLimit.phaseLimit) { pPass25 = false; reasons25.push(`Phase Error (${pVal}) exceeds ±${loadLimit.phaseLimit}`); }
            }
          }
          row.r25_r_pass = rPass25; row.r25_p_pass = pPass25; row.r25_pass = rPass25 && pPass25;
          row.r25_reason = reasons25.length > 0 ? reasons25.join('; ') : null;
        });
      }
      return { ...resultBlock, internalCoreNo: coreId || resultBlock.internalCoreNo, accuracyClass: coreAccuracyClass };
    });

    // Explicitly update fields for merging
    if (!transformerDoc.testHistory.primary_test) {
      transformerDoc.testHistory.primary_test = {};
    }

    transformerDoc.testHistory.primary_test.status = "Completed";
    transformerDoc.testHistory.primary_test.tester = tester;
    transformerDoc.testHistory.primary_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformerDoc.testHistory.primary_test.reportDate) {
      transformerDoc.testHistory.primary_test.reportDate = new Date();
    }

    // Merge logic: Filter out old results for this coreId/internalCoreNo, then append new ones
    const newResults = validatedResults;
    const existingResults = transformerDoc.testHistory.primary_test.metering_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );

    transformerDoc.testHistory.primary_test.metering_results = [...otherCoresResults, ...newResults];
    transformerDoc.markModified('testHistory');

    const transformer = await transformerDoc.save();

    if (!transformer) {
      console.log(`[ERROR] Transformer not found for uniqueId: "${uniqueId}"`);
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    res.status(201).json({ success: true, message: "Primary Metering Test Saved" });
  } catch (err) {
    console.error("Error saving primary metering test:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


//primary protection test handle
router.post("/transformer-primary-protection-tests", async (req, res) => {
  try {
    const { uniqueId, tester, coreId, protection_results } = req.body;
    console.log(`[DEBUG] POST /transformer-primary-protection-tests. Core: ${coreId}`);

    const transformer = await TransformerModel.findOne({ uniqueId: uniqueId });

    if (!transformer) {
      return res.status(404).json({ success: false, message: `Transformer ID [${uniqueId}] not found.` });
    }

    if (!transformer.testHistory.primary_test) transformer.testHistory.primary_test = {};

    transformer.testHistory.primary_test.tester = tester;

    // Merge logic for Protection (Primary)
    const newResults = protection_results.map(r => ({ ...r, internalCoreNo: coreId }));
    const existingResults = transformer.testHistory.primary_test.protection_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );
    transformer.testHistory.primary_test.protection_results = [...otherCoresResults, ...newResults];
    transformer.testHistory.primary_test.status = "Completed";
    transformer.testHistory.primary_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformer.testHistory.primary_test.reportDate) {
      transformer.testHistory.primary_test.reportDate = new Date();
    }

    transformer.markModified('testHistory');
    const savedTransformer = await transformer.save();

    res.status(201).json({
      success: true,
      message: "Primary Protection Test Saved Successfully",
      transformerId: savedTransformer._id
    });

  } catch (err) {
    console.error("Backend Error:", err);
    res.status(400).json({
      success: false,
      message: "Failed to save protection test",
      error: err.message
    });
  }
});


//primary PS test handle
router.post("/transformer-primary-ps-tests", async (req, res) => {
  try {
    const { uniqueId, tester, ps_results, coreId } = req.body;

    const transformerDoc = await TransformerModel.findOne({ uniqueId: uniqueId });
    if (!transformerDoc) {
      return res.status(404).json({ success: false, message: `Transformer ID [${uniqueId}] not found.` });
    }

    // Initialize if missing
    if (!transformerDoc.testHistory.primary_test) transformerDoc.testHistory.primary_test = {};

    transformerDoc.testHistory.primary_test.tester = tester;

    // Merge logic for PS
    const newResults = ps_results.map(r => ({ ...r, internalCoreNo: coreId || r.internalCoreNo || r.coreId }));
    const existingResults = transformerDoc.testHistory.primary_test.ps_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );

    transformerDoc.testHistory.primary_test.ps_results = [...otherCoresResults, ...newResults];
    transformerDoc.testHistory.primary_test.status = "Completed";
    transformerDoc.testHistory.primary_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformerDoc.testHistory.primary_test.reportDate) {
      transformerDoc.testHistory.primary_test.reportDate = new Date();
    }

    transformerDoc.markModified('testHistory');
    const transformer = await transformerDoc.save();

    // ✅ FIXED: Standard error handling for missing ID
    if (!transformer) {
      return res.status(404).json({
        success: false,
        message: `Transformer ID [${uniqueId}] not found in database.`
      });
    }

    // ✅ SUCCESS: Response
    res.status(201).json({
      success: true,
      message: "Primary PS Test Saved Successfully",
      transformerId: transformer._id
    });

  } catch (err) {
    console.error("Backend PS Save Error:", err);
    res.status(400).json({
      success: false,
      message: "Failed to save PS test",
      error: err.message
    });
  }
});


//final Metering test handle
router.post("/transformer-final-metering-tests", async (req, res) => {
  try {
    const { uniqueId, tester, metering_results, coreId } = req.body;
    console.log(`[DEBUG] POST /transformer-final-metering-tests. Payload:`, req.body);

    // Fetch the Transformer to get Accuracy Class
    const transformerDoc = await TransformerModel.findOne({ uniqueId: uniqueId }).populate('orderId');
    if (!transformerDoc) {
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    const accuracyClass = transformerDoc.orderId ? transformerDoc.orderId.accuracyClass : "0.5";

    // Fetch dynamic limits from DB
    const dbLimits = await AccuracyLimit.find({ coreType: 'metering', transformerType: 'CT' }).lean();

    // Validate Readings
    const validatedResults = metering_results.map(resultBlock => {
      const coreAccuracyClass = resultBlock.accuracyClass || accuracyClass || "0.5";
      const cleanClass = String(coreAccuracyClass).toUpperCase().replace(/\s+/g, '');
      const limitConfig = dbLimits.find(l => {
        const lClass = l.accuracyClass ? String(l.accuracyClass).toUpperCase().replace(/\s+/g, '') : '';
        return lClass === cleanClass;
      });

      if (resultBlock.rows) {
        resultBlock.rows.forEach(row => {
          let rPass = true, pPass = true;
          const reasons = [];
          const loadLimit = limitConfig?.limits?.find(l => String(l.load) === String(row.current));

          if (row.r100 !== undefined && row.r100 !== null && String(row.r100).trim() !== '') {
            const rVal = parseFloat(row.r100);
            if (!isNaN(rVal) && loadLimit?.ratioLimit !== undefined) {
              if (Math.abs(rVal) >= loadLimit.ratioLimit) { rPass = false; reasons.push(`Ratio Error (${rVal}) exceeds ±${loadLimit.ratioLimit}`); }
            }
          }
          if (row.p100 !== undefined && row.p100 !== null && String(row.p100).trim() !== '') {
            const pVal = parseFloat(row.p100);
            if (!isNaN(pVal) && loadLimit?.phaseLimit !== undefined && loadLimit.phaseLimit !== null) {
              if (Math.abs(pVal) >= loadLimit.phaseLimit) { pPass = false; reasons.push(`Phase Error (${pVal}) exceeds ±${loadLimit.phaseLimit}`); }
            }
          }
          row.r100_r_pass = rPass; row.r100_p_pass = pPass; row.r100_pass = rPass && pPass;
          row.r100_reason = reasons.length > 0 ? reasons.join('; ') : null;

          let rPass25 = true, pPass25 = true;
          const reasons25 = [];
          if (row.r25 !== undefined && row.r25 !== null && String(row.r25).trim() !== '') {
            const rVal = parseFloat(row.r25);
            if (!isNaN(rVal) && loadLimit?.ratioLimit !== undefined) {
              if (Math.abs(rVal) >= loadLimit.ratioLimit) { rPass25 = false; reasons25.push(`Ratio Error (${rVal}) exceeds ±${loadLimit.ratioLimit}`); }
            }
          }
          if (row.p25 !== undefined && row.p25 !== null && String(row.p25).trim() !== '') {
            const pVal = parseFloat(row.p25);
            if (!isNaN(pVal) && loadLimit?.phaseLimit !== undefined && loadLimit.phaseLimit !== null) {
              if (Math.abs(pVal) >= loadLimit.phaseLimit) { pPass25 = false; reasons25.push(`Phase Error (${pVal}) exceeds ±${loadLimit.phaseLimit}`); }
            }
          }
          row.r25_r_pass = rPass25; row.r25_p_pass = pPass25; row.r25_pass = rPass25 && pPass25;
          row.r25_reason = reasons25.length > 0 ? reasons25.join('; ') : null;
        });
      }
      return { ...resultBlock, internalCoreNo: coreId || resultBlock.internalCoreNo, accuracyClass: coreAccuracyClass };
    });

    // Explicitly update fields for merging
    if (!transformerDoc.testHistory.final_test) {
      transformerDoc.testHistory.final_test = {};
    }

    transformerDoc.testHistory.final_test.status = "Completed";
    transformerDoc.testHistory.final_test.tester = tester;
    transformerDoc.testHistory.final_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformerDoc.testHistory.final_test.reportDate) {
      transformerDoc.testHistory.final_test.reportDate = new Date();
    }

    // Merge logic: Filter out old results for this coreId, then append new ones
    const newResults = validatedResults;
    const existingResults = transformerDoc.testHistory.final_test.metering_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );

    transformerDoc.testHistory.final_test.metering_results = [...otherCoresResults, ...newResults];
    transformerDoc.markModified('testHistory');

    const transformer = await transformerDoc.save();

    if (!transformer) {
      console.log(`[ERROR] Transformer not found for uniqueId: "${uniqueId}"`);
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    res.status(201).json({ success: true, message: "Final Metering Test Saved" });
  } catch (err) {
    console.error("Error saving final metering test:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


//final protection test handle
router.post("/transformer-final-protection-tests", async (req, res) => {
  try {
    const { uniqueId, tester, coreId, protection_results } = req.body;
    console.log(`[DEBUG] POST /transformer-final-protection-tests. Core: ${coreId}`);

    const transformer = await TransformerModel.findOne({ uniqueId: uniqueId });

    if (!transformer) {
      return res.status(404).json({ success: false, message: `Transformer ID [${uniqueId}] not found.` });
    }

    if (!transformer.testHistory.final_test) transformer.testHistory.final_test = {};

    transformer.testHistory.final_test.tester = tester;

    // Merge logic for Protection (Final)
    const { validateProtectionReading } = require('../utils/protectionLimits');
    const newResults = protection_results.map(r => {
      const validation = validateProtectionReading(
        r.protectionClass,
        r.ratioError100,
        r.phaseError,
        r.compositeError
      );
      return {
        ...r,
        internalCoreNo: coreId,
        isPass: validation.isPass,
        reason: validation.reason
      };
    });
    const existingResults = transformer.testHistory.final_test.protection_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );
    transformer.testHistory.final_test.protection_results = [...otherCoresResults, ...newResults];
    transformer.testHistory.final_test.status = "Completed";
    transformer.testHistory.final_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformer.testHistory.final_test.reportDate) {
      transformer.testHistory.final_test.reportDate = new Date();
    }

    transformer.markModified('testHistory');
    const savedTransformer = await transformer.save();

    res.status(201).json({
      success: true,
      message: "Final Protection Test Saved Successfully",
      transformerId: savedTransformer._id
    });

  } catch (err) {
    console.error("Backend Error:", err);
    res.status(400).json({
      success: false,
      message: "Failed to save protection test",
      error: err.message
    });
  }
});


//primary PS test handle
router.post("/transformer-final-ps-tests", async (req, res) => {
  try {
    const { uniqueId, tester, ps_results, coreId } = req.body;

    const existingTransformer = await TransformerModel.findOne({ uniqueId: uniqueId });
    if (!existingTransformer) {
      return res.status(404).json({
        success: false,
        message: `Transformer ID [${uniqueId}] not found in database.`
      });
    }

    // Initialize if missing
    if (!existingTransformer.testHistory.final_test) existingTransformer.testHistory.final_test = {};

    existingTransformer.testHistory.final_test.tester = tester;

    // Merge logic for PS (Final)
    const newResults = ps_results.map(r => ({ ...r, internalCoreNo: coreId || r.internalCoreNo || r.coreId }));
    const existingResults = existingTransformer.testHistory.final_test.ps_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );

    existingTransformer.testHistory.final_test.ps_results = [...otherCoresResults, ...newResults];
    existingTransformer.testHistory.final_test.status = "Completed";
    existingTransformer.testHistory.final_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!existingTransformer.testHistory.final_test.reportDate) {
      existingTransformer.testHistory.final_test.reportDate = new Date();
    }

    existingTransformer.markModified('testHistory');
    const transformer = await existingTransformer.save();

    // ✅ FIXED: Standard error handling for missing ID
    if (!transformer) {
      return res.status(404).json({
        success: false,
        message: `Transformer ID [${uniqueId}] not found in database.`
      });
    }

    // ✅ SUCCESS: Response
    res.status(201).json({
      success: true,
      message: "Final PS Test Saved Successfully",
      transformerId: transformer._id
    });

  } catch (err) {
    console.error("Backend PS Save Error:", err);
    res.status(400).json({
      success: false,
      message: "Failed to save PS test",
      error: err.message
    });
  }
});









// -------------------------------------------------------------------
// SECONDARY TEST ROUTES
// -------------------------------------------------------------------

router.post("/transformer-secondary-metering-tests", async (req, res) => {
  try {
    const { uniqueId, coreId, tester, metering_results, remarks } = req.body;
    const { validateMeteringReading } = require('../utils/accuracyLimits');

    // 0. Fetch the Transformer & Order to get Accuracy Class
    const transformerDoc = await TransformerModel.findOne({ uniqueId: uniqueId }).populate('orderId');
    if (!transformerDoc) {
      console.log(`[ERROR] Transformer not found for uniqueId: "${uniqueId}"`);
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    const order = transformerDoc.orderId;
    const accuracyClass = order ? order.accuracyClass : "0.5"; // Default if not found

    // Fetch dynamic limits from DB
    const dbLimits = await AccuracyLimit.find({ coreType: 'metering', transformerType: 'CT' }).lean();

    // 0.5. Validate Readings
    let isOverallPass = true;
    const validatedResults = metering_results.map(resultBlock => {
      const coreAccuracyClass = resultBlock.accuracyClass || accuracyClass || "0.5";
      const cleanClass = String(coreAccuracyClass).toUpperCase().replace(/\s+/g, '');
      
      // Find matching limit config from DB
      const limitConfig = dbLimits.find(l => {
        const lClass = l.accuracyClass ? String(l.accuracyClass).toUpperCase().replace(/\s+/g, '') : '';
        return lClass === cleanClass;
      });

      if (resultBlock.rows) {
        resultBlock.rows.forEach(row => {
          // Manual Validation against DB limits
          let rPass = true;
          let pPass = true;
          const reasons = [];

          const loadLimit = limitConfig?.limits?.find(l => String(l.load) === String(row.current));

          if (row.r100 !== undefined && row.r100 !== null && String(row.r100).trim() !== '') {
            const rVal = parseFloat(row.r100);
            if (!isNaN(rVal) && loadLimit?.ratioLimit !== undefined) {
              if (Math.abs(rVal) >= loadLimit.ratioLimit) {
                rPass = false;
                reasons.push(`Ratio Error (${rVal}) exceeds ±${loadLimit.ratioLimit}`);
              }
            }
          }

          if (row.p100 !== undefined && row.p100 !== null && String(row.p100).trim() !== '') {
            const pVal = parseFloat(row.p100);
            if (!isNaN(pVal) && loadLimit?.phaseLimit !== undefined && loadLimit.phaseLimit !== null) {
              if (Math.abs(pVal) >= loadLimit.phaseLimit) {
                pPass = false;
                reasons.push(`Phase Error (${pVal}) exceeds ±${loadLimit.phaseLimit}`);
              }
            }
          }

          row.r100_r_pass = rPass;
          row.r100_p_pass = pPass;
          row.r100_pass = rPass && pPass;
          row.r100_reason = reasons.length > 0 ? reasons.join('; ') : null;

          // 25% Burden
          let rPass25 = true;
          let pPass25 = true;
          const reasons25 = [];

          if (row.r25 !== undefined && row.r25 !== null && String(row.r25).trim() !== '') {
            const rVal = parseFloat(row.r25);
            if (!isNaN(rVal) && loadLimit?.ratioLimit !== undefined) {
              if (Math.abs(rVal) >= loadLimit.ratioLimit) {
                rPass25 = false;
                reasons25.push(`Ratio Error (${rVal}) exceeds ±${loadLimit.ratioLimit}`);
              }
            }
          }

          if (row.p25 !== undefined && row.p25 !== null && String(row.p25).trim() !== '') {
            const pVal = parseFloat(row.p25);
            if (!isNaN(pVal) && loadLimit?.phaseLimit !== undefined && loadLimit.phaseLimit !== null) {
              if (Math.abs(pVal) >= loadLimit.phaseLimit) {
                pPass25 = false;
                reasons25.push(`Phase Error (${pVal}) exceeds ±${loadLimit.phaseLimit}`);
              }
            }
          }

          row.r25_r_pass = rPass25;
          row.r25_p_pass = pPass25;
          row.r25_pass = rPass25 && pPass25;
          row.r25_reason = reasons25.length > 0 ? reasons25.join('; ') : null;

          if (!row.r100_pass || !row.r25_pass) {
            isOverallPass = false;
          }
        });
      }
      return { ...resultBlock, internalCoreNo: coreId, accuracyClass: coreAccuracyClass };
    });

    const finalStatus = isOverallPass ? "Pass" : "Fail";

    // 1. Save detailed test report (Upsert)
    const existingTestRecord = await SecondaryMeteringTestModel.findOne({ uniqueId, coreId });
    const updatePayload = {
      uniqueId,
      coreId,
      tester,
      metering_results: validatedResults,
      remarks,
      testDate: new Date(),
      status: finalStatus
    };

    if (!existingTestRecord || !existingTestRecord.reportDate) {
      updatePayload.reportDate = new Date();
    }

    const testRecord = await SecondaryMeteringTestModel.findOneAndUpdate(
      { uniqueId, coreId },
      updatePayload,
      { upsert: true, new: true, runValidators: true }
    );

    // 2. Update Master Transformer Status
    // 2. Update Master Transformer Status
    const transformer = await TransformerModel.findOne({ uniqueId: uniqueId });

    if (!transformer) {
      console.log(`[ERROR] Transformer not found for uniqueId: "${uniqueId}"`);
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    // Explicitly update fields
    if (!transformer.testHistory.secondary_test) {
      transformer.testHistory.secondary_test = {};
    }

    transformer.testHistory.secondary_test.status = "Completed";
    transformer.testHistory.secondary_test.tester = tester;
    transformer.testHistory.secondary_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformer.testHistory.secondary_test.reportDate) {
      transformer.testHistory.secondary_test.reportDate = new Date();
    }

    // Merge logic: Filter out old results for this coreId, then append new ones
    // Note: validatedResults from frontend is an ARRAY of ratios for this core, correctly populated with pass/fail statuses.
    const newResults = validatedResults; // use the array that already has r100_pass etc

    const existingResults = transformer.testHistory.secondary_test.metering_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );

    transformer.testHistory.secondary_test.metering_results = [...otherCoresResults, ...newResults];

    // Mark modified (sometimes needed for mixed types, though these are schemas)
    transformer.markModified('testHistory');

    const savedTransformer = await transformer.save();
    console.log("[DEBUG] Transformer Saved. Secondary Results Length:", savedTransformer.testHistory.secondary_test.metering_results.length);


    // Verify transformer update
    if (!transformer) {
      console.log(`[ERROR] Transformer not found for uniqueId: "${uniqueId}"`);
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    res.status(201).json({
      success: true,
      message: "Secondary Metering Test Saved",
      data: testRecord
    });

  } catch (error) {
    console.error("Error saving secondary metering test:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------------
// SECONDARY PS TEST
// -------------------------------------------------------------------
router.post("/transformer-secondary-ps-tests", async (req, res) => {
  try {
    const { uniqueId, tester, coreId, ps_results } = req.body;
    console.log(`[DEBUG] POST /transformer-secondary-ps-tests. Payload:`, req.body);

    // PS Test Update
    const transformer = await TransformerModel.findOne({ uniqueId: uniqueId });

    if (!transformer) {
      return res.status(404).json({ success: false, message: `Transformer ID [${uniqueId}] not found.` });
    }

    // Initialize if missing
    if (!transformer.testHistory.secondary_test) transformer.testHistory.secondary_test = {};

    transformer.testHistory.secondary_test.tester = tester;
    // Merge logic for PS
    const newResults = ps_results.map(r => ({ ...r, internalCoreNo: coreId }));
    const existingResults = transformer.testHistory.secondary_test.ps_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );
    transformer.testHistory.secondary_test.ps_results = [...otherCoresResults, ...newResults];
    transformer.testHistory.secondary_test.status = "Completed";
    transformer.testHistory.secondary_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformer.testHistory.secondary_test.reportDate) {
      transformer.testHistory.secondary_test.reportDate = new Date();
    }

    transformer.markModified('testHistory');
    const savedTransformer = await transformer.save();
    console.log("[DEBUG] PS Test Saved. Results Length:", savedTransformer.testHistory.secondary_test.ps_results.length);

    res.status(201).json({
      success: true,
      message: "Secondary PS Test Saved Successfully",
      transformerId: savedTransformer._id
    });

  } catch (err) {
    console.error("Backend PS Save Error:", err);
    res.status(400).json({ success: false, message: "Failed to save PS test", error: err.message });
  }
});

// -------------------------------------------------------------------
// SECONDARY PROTECTION TEST
// -------------------------------------------------------------------
router.post("/transformer-secondary-protection-tests", async (req, res) => {
  try {
    const { uniqueId, tester, coreId, protection_results } = req.body;
    console.log(`[DEBUG] POST /transformer-secondary-protection-tests. Payload:`, req.body);

    const transformer = await TransformerModel.findOne({ uniqueId: uniqueId });

    if (!transformer) {
      return res.status(404).json({ success: false, message: `Transformer ID [${uniqueId}] not found.` });
    }

    if (!transformer.testHistory.secondary_test) transformer.testHistory.secondary_test = {};

    transformer.testHistory.secondary_test.tester = tester;
    // Merge logic for Protection
    const { validateProtectionReading } = require('../utils/protectionLimits');
    const newResults = protection_results.map(r => {
      const validation = validateProtectionReading(
        r.protectionClass,
        r.ratioError100,
        r.phaseError,
        r.compositeError
      );
      return {
        ...r,
        internalCoreNo: coreId,
        isPass: validation.isPass,
        reason: validation.reason
      };
    });
    const existingResults = transformer.testHistory.secondary_test.protection_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );
    transformer.testHistory.secondary_test.protection_results = [...otherCoresResults, ...newResults];
    transformer.testHistory.secondary_test.status = "Completed";
    transformer.testHistory.secondary_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformer.testHistory.secondary_test.reportDate) {
      transformer.testHistory.secondary_test.reportDate = new Date();
    }

    transformer.markModified('testHistory');
    const savedTransformer = await transformer.save();
    console.log("[DEBUG] Protection Test Saved. Results Length:", savedTransformer.testHistory.secondary_test.protection_results.length);

    res.status(201).json({
      success: true,
      message: "Secondary Protection Test Saved Successfully",
      transformerId: savedTransformer._id
    });

  } catch (err) {
    console.error("Backend Protection Save Error:", err);
    res.status(400).json({ success: false, message: "Failed to save Protection test", error: err.message });
  }
});


module.exports = router;

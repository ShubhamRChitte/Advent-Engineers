const express = require('express');
const router = express.Router();
const { TransformerModel } = require('../models/TransformerModel');
const { OrderModel } = require('../models/OrderModel');
const { FailedTransformerModel } = require('../models/FailedTransformerModel');
const { NotificationModel } = require('../models/NotificationModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// POST /api/pt-tests/submit
// Submit a full PT Test Report for a specific transformer
router.post('/submit', isAuthenticated, async (req, res) => {
  try {
    const { transformerId, orderId, reportData } = req.body;
    
    if (!transformerId || !orderId || !reportData) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // 1. Find the Transformer
    const transformer = await TransformerModel.findById(transformerId);
    if (!transformer) {
      return res.status(404).json({ success: false, message: "Transformer not found." });
    }

    // NOTE: We intentionally do NOT enforce currentStage === 'pt' here.
    // PT testers should be able to save/re-edit a report even after the transformer
    // has moved to a subsequent stage (e.g., after initial save).

    // 2. Update the Transformer's PT test history via direct query
    // Using findByIdAndUpdate ensures MongoDB updates the Mixed type reliably
    const updatePayload = {
      ...reportData,
      savedAt: new Date(),
      savedBy: req.user?.name || req.user?.fullName || 'PT Tester'
    };

    const updateFields = {
      'testHistory.pt_pretest_test': updatePayload
    };

    // Keep transformer at 'pt' stage so it remains visible in PT list
    if (transformer.currentStage === 'pt') {
      updateFields.currentStage = 'pt';
    }

    await TransformerModel.findByIdAndUpdate(transformerId, {
      $set: updateFields
    });

    // 3. Check if ALL transformers for this order have PT test data
    const allTransformers = await TransformerModel.find({
      $or: [{ orderId: orderId }, { orderId: orderId.toString() }]
    }).lean();

    const allCompleted = allTransformers.length > 0 && allTransformers.every(
      t => t.testHistory && t.testHistory.pt_pretest_test && Object.keys(t.testHistory.pt_pretest_test).length > 0
    );

    // 4. Update Order status
    // Instead of auto-completing, we leave it "In Progress" until manually approved
    await OrderModel.findByIdAndUpdate(orderId, {
      $set: { status: 'PT Pretesting In Progress' }
    });

    res.status(200).json({ 
      success: true, 
      message: "PT Test Report submitted successfully.",
      allCompleted: allCompleted
    });
  } catch (error) {
    console.error("Error submitting PT report:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
});

// @route   PUT /api/pt-tests/:orderId/approve
// @desc    Manually approve the order after all PT tests are done
// @access  Private
router.put('/:orderId/approve', isAuthenticated, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Verify all transformers actually have data
    const allTransformers = await TransformerModel.find({
      $or: [{ orderId: orderId }, { orderId: orderId.toString() }]
    }).lean();

    if (allTransformers.length === 0) {
       return res.status(400).json({ success: false, message: "No transformers found in this order." });
    }

    const allCompleted = allTransformers.every(
      t => t.testHistory && t.testHistory.pt_pretest_test && Object.keys(t.testHistory.pt_pretest_test).length > 0
    );

    if (!allCompleted) {
       return res.status(400).json({ success: false, message: "Cannot approve. Not all transformers have testing data saved." });
    }

    // Set approved flag and stage on all transformers in the order
    for (const transformer of allTransformers) {
      const ptTestUpdate = { ...transformer.testHistory.pt_pretest_test, approved: true };
      await TransformerModel.findByIdAndUpdate(transformer._id, {
        $set: { 
          'testHistory.pt_pretest_test': ptTestUpdate,
          currentStage: 'pt'
        }
      });
    }

    await OrderModel.findByIdAndUpdate(orderId, {
      $set: { 
        status: 'PT Testing In Progress',
        'completionStages.pt_pretest': true,
        currentStage: 'pt'
      }
    });

    try {
        const order = await OrderModel.findById(orderId);
        await NotificationModel.create({
            recipientRole: 'pt',
            message: `Order pre-testing approved. Ready for Final PT Test.`,
            orderId: orderId,
            jobId: order ? order.jobId : 'Unknown Job',
            type: 'STAGE_TRANSITION'
        });
    } catch (notifErr) {
        console.error("Error creating notification:", notifErr);
    }

    res.status(200).json({ success: true, message: "PT Pretesting approved and completed successfully." });
  } catch (error) {
    console.error("Error approving PT order:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
});

// @route   PUT /api/pt-tests/transformer/:transformerId/approve
// @desc    Manually approve a specific transformer after PT test is done
// @access  Private
router.put('/transformer/:transformerId/approve', isAuthenticated, async (req, res) => {
  try {
    const { transformerId } = req.params;

    const transformer = await TransformerModel.findById(transformerId);
    if (!transformer) {
      return res.status(404).json({ success: false, message: "Transformer not found." });
    }

    // 2. CHECK: Must have PT Pretesting data
    if (!transformer.testHistory || !transformer.testHistory.pt_pretest_test || Object.keys(transformer.testHistory.pt_pretest_test).length === 0) {
      return res.status(400).json({ success: false, message: "Cannot approve. Transformer doesn't have PT Pretesting data saved." });
    }

    // 3. CHECK: Unified PT report completeness (Check all active cores)
    const ptTest = transformer.testHistory.pt_pretest_test;
    const preTestingObj = ptTest.preTesting || {};
    const coreKeys = Object.keys(preTestingObj).filter(k => k !== 'testedBy' && k !== 'date');

    if (coreKeys.length === 0) {
      return res.status(400).json({ success: false, message: "Cannot approve. No core data found in Pre-Testing section." });
    }

    const mandatoryPre = ['ratioError100', 'phaseError100'];
    const isPreComplete = coreKeys.every(coreKey => {
      const coreData = preTestingObj[coreKey] || {};
      return mandatoryPre.every(f => coreData[f] && coreData[f].toString().trim() !== '' && coreData[f].toString() !== 'N/A');
    });

    if (!isPreComplete) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot approve. The report is missing required data in one or more Pre-Testing cores." 
      });
    }

    // Set approved flag on transformer's PT test
    const ptTestUpdate = { ...transformer.testHistory.pt_pretest_test, approved: true };
    await TransformerModel.findByIdAndUpdate(transformerId, {
      $set: { 
        'testHistory.pt_pretest_test': ptTestUpdate,
        currentStage: 'pt' // Move transformer to Final PT Testing stage
      }
    });

    // Check if ALL transformers for the same order are approved now
    const orderId = transformer.orderId;
    const allTransformers = await TransformerModel.find({
      $or: [{ orderId: orderId }, { orderId: orderId.toString() }]
    }).lean();

    // Consider all completed and approved
    // Using an optional chaining like t.testHistory?.pt_pretest_test?.approved
    // and older orders might not have this, so we maintain backward compatibility
    const allApproved = allTransformers.length > 0 && allTransformers.every(
      t => t.testHistory && t.testHistory.pt_pretest_test && (t.testHistory.pt_pretest_test.approved === true || t.testHistory.pt_pretest_test.approved === "true")
    );

    if (allApproved) {
      await OrderModel.findByIdAndUpdate(orderId, {
        $set: { 
          status: 'PT Testing Assigned', // Hand off to Final PT Testing dashboard (Active Orders)
          'completionStages.pt_pretest': true,
          currentStage: 'pt' // Move the order to final pt dashboard
        }
      });

      try {
          const order = await OrderModel.findById(orderId);
          await NotificationModel.create({
              recipientRole: 'pt',
              message: `Order pre-testing approved. Ready for Final PT Test.`,
              orderId: orderId,
              jobId: order ? order.jobId : 'Unknown Job',
              type: 'STAGE_TRANSITION'
          });
      } catch (notifErr) {
          console.error("Error creating notification:", notifErr);
      }
    } else {
      // Partially approved - order status remains in progress
      await OrderModel.findByIdAndUpdate(orderId, {
         $set: { status: 'PT Pretesting In Progress' }
      });
    }

    res.status(200).json({ success: true, message: "Transformer approved successfully.", allApproved });
  } catch (error) {
    console.error("Error approving transformer:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
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
            stage: "pt_pretest_testING",
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

// GET /api/pt-tests/all-transformers
// Fetch all transformers for PT Orders for the dashboard
router.get('/all-transformers', isAuthenticated, async (req, res) => {
    try {
        // Find all PT Orders
        // You can optimize by filtering out older fully completed orders if needed, 
        // but for safety we get recent ones or all
        const ptOrders = await OrderModel.find({ transformerType: 'PT' }).select('_id quantity jobId clientName status assignedDate deadline ratio').lean();
        const orderIds = ptOrders.map(o => o._id);

        const transformers = await TransformerModel.find({ orderId: { $in: orderIds } })
            .populate({
                path: 'orderId',
                select: 'jobId clientName quantity ratio status assignedDate deadline transformerName accuracyClass coreDetails'
            })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ success: true, transformers });
    } catch (err) {
        console.error("Error fetching all pt transformers:", err);
        res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
});

// GET /api/pt-tests/reports
// Fetch all transformers that have PT test history
router.get('/reports', isAuthenticated, async (req, res) => {
    try {
        const query = {
            'testHistory.pt_pretest_test': { $exists: true, $ne: {} }, // ensure it's not the default empty object
            $or: [
                { 'testHistory.pt_pretest_test.approved': true },
                { 'testHistory.pt_pretest_test.approved': "true" }
            ]
        };

        const transformers = await TransformerModel.find(query)
            .populate({
                path: 'orderId',
                match: { transformerType: 'PT' }, // Filter by PT Orders at population level
                select: 'clientName quantity deadline ratio accuracyClass burden voltageRating jobId'
            })
            .sort({ 'testHistory.pt_pretest_test.date': -1 })
            .lean();
            
        // Filter out docs where populate failed (wasn't a PT order) or where pt_pretest_test is logically empty
        const validTransformers = transformers.filter(t => 
             t.orderId !== null &&
             t.testHistory && 
             t.testHistory.pt_pretest_test && 
             Object.keys(t.testHistory.pt_pretest_test).length > 0
        );

        // Enrich with jobId and clientName from populated order (mirrors secondary/reports route)
        const enrichedTransformers = validTransformers.map(t => {
            const obj = t;
            if (obj.orderId) {
                obj.jobId = obj.orderId.jobId;
                obj.clientName = obj.orderId.clientName;
                obj.accuracyClass = obj.orderId.accuracyClass;
            }
            return obj;
        });

        res.json(enrichedTransformers);
    } catch (error) {
        console.error("Error fetching PT reports:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

router.get('/assigned-orders', isAuthenticated, async (req, res) => {
  try {
      const user = req.user;
      const testerName = user.name || user.fullName;

      // 1. Find all transformers where this user is assigned for PT Pretest stage
      const query = {
          "assignments.pt_pretest_tester": testerName,
          currentStage: { $in: ['pt_pretest', 'pt', 'final_print', 'dispatch', 'completed'] }
      };

      const transformers = await TransformerModel.find(query).populate('orderId').lean();

      // 2. Map to Orders
      const ordersMap = new Map();
      transformers.forEach(t => {
          if (t.orderId) {
              const oid = t.orderId._id.toString();
               if (!ordersMap.has(oid)) {
                  const order = { ...t.orderId, assignedUnitIds: [] };
                  ordersMap.set(oid, order);
              }
              const order = ordersMap.get(oid);
              if (!order.assignedUnitIds.includes(t.uniqueId)) {
                  order.assignedUnitIds.push(t.uniqueId);
              }
          }
      });

      const orders = Array.from(ordersMap.values());
      res.json({ success: true, orders });
  } catch (error) {
      console.error("Error fetching PT assigned orders:", error);
      res.status(500).json({ success: false, error: error.message });
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
            data: transformer.testHistory?.pt_pretest_test || null
        });

    } catch (err) {
        console.error("Error fetching PT Test:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;


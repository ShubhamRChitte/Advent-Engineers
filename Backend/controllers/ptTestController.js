const { TransformerModel } = require('../models/TransformerModel');
const { OrderModel } = require('../models/OrderModel');
const { FailedTransformerModel } = require('../models/FailedTransformerModel');

// POST /submit
// Submit a full PT Test Report for a specific transformer
exports.submitReport = async (req, res) => {
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

    // 2. Update the Transformer's PT test history via direct query
    const updatePayload = {
      ...reportData,
      savedAt: new Date(),
      savedBy: req.user?.name || req.user?.fullName || 'PT Tester'
    };

    const updateFields = {
      'testHistory.pt_test': updatePayload
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
      t => t.testHistory && t.testHistory.pt_test && Object.keys(t.testHistory.pt_test).length > 0
    );

    // 4. Update Order status
    await OrderModel.findByIdAndUpdate(orderId, {
      $set: { status: 'PT Testing In Progress' }
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
};

// PUT /:orderId/approve
// Manually approve the order after all PT tests are done
exports.approveOrder = async (req, res) => {
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
      t => t.testHistory && t.testHistory.pt_test && Object.keys(t.testHistory.pt_test).length > 0
    );

    if (!allCompleted) {
       return res.status(400).json({ success: false, message: "Cannot approve. Not all transformers have testing data saved." });
    }

    // Set approved flag on all transformers in the order
    for (const transformer of allTransformers) {
      const ptTestUpdate = { 
        ...transformer.testHistory.pt_test, 
        approved: true,
        timestamp: new Date()
      };
      await TransformerModel.findByIdAndUpdate(transformer._id, {
        $set: { 'testHistory.pt_test': ptTestUpdate }
      });
    }

    await OrderModel.findByIdAndUpdate(orderId, {
      $set: { 
        status: 'PT Testing Completed',
        'completionStages.pt': true
      }
    });

    res.status(200).json({ success: true, message: "PT Testing approved and completed successfully." });
  } catch (error) {
    console.error("Error approving PT order:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// PUT /transformer/:transformerId/approve
// Manually approve a specific transformer after PT test is done
exports.approveTransformer = async (req, res) => {
  try {
    const { transformerId } = req.params;

    const transformer = await TransformerModel.findById(transformerId);
    if (!transformer) {
      return res.status(404).json({ success: false, message: "Transformer not found." });
    }

    // 2. CHECK: Must have PT testing data
    if (!transformer.testHistory || !transformer.testHistory.pt_test || Object.keys(transformer.testHistory.pt_test).length === 0) {
      return res.status(400).json({ success: false, message: "Cannot approve. Transformer doesn't have PT testing data saved." });
    }

    const ptTest = transformer.testHistory.pt_test;
    const finalTesting = ptTest.finalTesting || {};
    const mandatoryFinal = ['leakage', 'terminalMarking', 'polarityTesting', 'insulationResistance', 'hvPrimary', 'hvSecondary', 'inducedOverVoltage'];
    const isFinalComplete = mandatoryFinal.every(f => finalTesting[f] && finalTesting[f].toString().trim() !== '' && finalTesting[f].toString() !== 'N/A');

    if (!isFinalComplete) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot approve. The report is missing required data in Final Testing section." 
      });
    }

    // 3. CHECK: Accuracy Test completeness (Check all cores)
    const accuracyTestObj = ptTest.accuracyTest || {};
    const accCoreKeys = Object.keys(accuracyTestObj);
    const mandatoryAcc = ['ratioError100', 'phaseError100'];

    const isAccComplete = accCoreKeys.length > 0 && accCoreKeys.every(coreKey => {
      const coreData = accuracyTestObj[coreKey] || {};
      const row100 = coreData['100'] || {};
      return mandatoryAcc.every(f => row100[f] && row100[f].toString().trim() !== '' && row100[f].toString() !== 'N/A');
    });

    if (!isAccComplete) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot approve. The Accuracy Test section is missing required core readings." 
      });
    }

    // Set approved flag on transformer's PT test and restore stage from pt_failed
    const ptTestUpdate = { 
      ...transformer.testHistory.pt_test, 
      approved: true,
      timestamp: new Date()
    };
    await TransformerModel.findByIdAndUpdate(transformerId, {
      $set: { 
        'testHistory.pt_test': ptTestUpdate,
        currentStage: 'pt'
      }
    });

    // Mark failed transformer records as RESOLVED since this transformer has been approved
    try {
      await FailedTransformerModel.updateMany(
        {
          $or: [
            { transformerId: transformer._id },
            { transformerUniqueId: transformer.uniqueId }
          ],
          status: { $in: ["FAILED", "TREATED"] }
        },
        { $set: { status: "RESOLVED" } }
      );
    } catch (ftErr) {
      console.error("Failed to mark failed transformer records as RESOLVED:", ftErr);
    }

    // Check if ALL transformers for the same order are approved now
    const orderId = transformer.orderId;
    const allTransformers = await TransformerModel.find({
      $or: [{ orderId: orderId }, { orderId: orderId.toString() }]
    }).lean();

    const allApproved = allTransformers.length > 0 && allTransformers.every(
      t => t.testHistory && t.testHistory.pt_test && (t.testHistory.pt_test.approved === true || t.testHistory.pt_test.approved === "true")
    );

    if (allApproved) {
      await OrderModel.findByIdAndUpdate(orderId, {
        $set: { 
          status: 'PT Testing Completed',
          'completionStages.pt': true
        }
      });
    } else {
      // Partially approved - order status remains in progress
      await OrderModel.findByIdAndUpdate(orderId, {
         $set: { status: 'PT Testing In Progress' }
      });
    }

    res.status(200).json({ success: true, message: "Transformer approved successfully.", allApproved });
  } catch (error) {
    console.error("Error approving transformer:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// POST /failed
// Log a failed PT transformer
exports.logFailed = async (req, res) => {
    try {
        const { transformerId, orderId, jobNumber, coreType, failureParameters, failureReason, reportedBy } = req.body;

        if (!transformerId || !orderId || !reportedBy) {
            return res.status(400).json({ success: false, message: "Missing required fields for failure logging." });
        }

        const effectiveCoreType = coreType || "PT_FINAL";
        const effectiveReason = failureReason || "Marked as failed by tester";

        // Lookup transformer to get uniqueId and update stage
        const transformer = await TransformerModel.findById(transformerId);
        if (!transformer) {
            return res.status(404).json({ success: false, message: "Transformer not found." });
        }

        // Set transformer stage to pt_failed
        transformer.currentStage = 'pt_failed';
        await transformer.save();

        const failedRecord = new FailedTransformerModel({
            transformerId,
            orderId,
            jobNumber,
            coreType: effectiveCoreType,
            failureParameters,
            failureReason: effectiveReason,
            reportedBy,
            transformerUniqueId: transformer.uniqueId,
            stage: "PT_TESTING",
            status: "FAILED"
        });

        await failedRecord.save();

        res.status(201).json({
            success: true,
            message: "Failed PT Transformer logged successfully",
            data: failedRecord
        });
    } catch (error) {
        console.error("Error saving failed PT transformer:", error);
        
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "This core has already been marked as failed." });
        }
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// GET /all-transformers
// Fetch all transformers for PT Orders for the dashboard
exports.getAllTransformers = async (req, res) => {
    try {
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
};

// GET /reports
// Fetch all transformers that have PT test history
exports.getReports = async (req, res) => {
    try {
        const query = {
            'testHistory.pt_test': { $exists: true, $ne: {} },
            $or: [
                { 'testHistory.pt_test.approved': true },
                { 'testHistory.pt_test.approved': "true" }
            ]
        };

        const transformers = await TransformerModel.find(query)
            .populate({
                path: 'orderId',
                match: { transformerType: 'PT' },
                select: 'clientName quantity deadline ratio accuracyClass burden voltageRating jobId coreDetails coreConfigs'
            })
            .sort({ 'testHistory.pt_test.date': -1 })
            .lean();
            
        const validTransformers = transformers.filter(t => 
             t.orderId !== null &&
             t.testHistory && 
             t.testHistory.pt_test && 
             Object.keys(t.testHistory.pt_test).length > 0
        );

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
};

// GET /assigned-orders
exports.getAssignedOrders = async (req, res) => {
  try {
      const user = req.user;
      const testerName = user.name || user.fullName;

      const query = {
          "assignments.pt_tester": testerName,
          currentStage: { $in: ['pt', 'final_print', 'dispatch', 'completed'] }
      };

      const transformers = await TransformerModel.find(query).populate('orderId').lean();

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
};

// GET /:transformerId
// Fetch existing PT test data for a transformer
exports.getTransformerData = async (req, res) => {
    try {
        const { transformerId } = req.params;
        const transformer = await TransformerModel.findById(transformerId);
        
        if (!transformer) {
            return res.status(404).json({ success: false, message: "Transformer not found" });
        }

        res.status(200).json({
            success: true,
            data: transformer.testHistory?.pt_test || null
        });

    } catch (err) {
        console.error("Error fetching PT Test:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

const { OrderModel } = require('../models/OrderModel');
const { TransformerModel } = require('../models/TransformerModel');
const { MeteringCoreTestModel } = require('../models/MeteringCoreTestModel');
const { ProtectionCoreTestModel } = require('../models/ProtectionCoreTestModel');
const { SecondaryMeteringTestModel } = require('../models/SecondaryMeteringTestModel');
const { FailedCoreModel } = require('../models/FailedCoreModel');
const { FailedTransformerModel } = require('../models/FailedTransformerModel');
const { NotificationModel } = require('../models/NotificationModel');
const ReadyTransformerModel = require('../models/ReadyTransformerModel');
const { HeatingRecordModel } = require('../models/HeatingRecordModel');
const { CounterModel } = require('../models/CounterModel');
const { cloudinary } = require('../config/cloudinary');

// Helper: Atomic Sequence Generator
async function getNextSequenceValue(sequenceName) {
  const sequenceDocument = await CounterModel.findOneAndUpdate(
    { id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.seq;
}

// Helper: Generate Transformers with Assignments
const generateTransformersForOrder = async (order) => {
  try {
    const { jobId, quantity, coreDetails, assignments } = order;
    const transformers = [];

    // 1. Create a map of Unit Number -> Assignments
    const unitAssignments = {};

    // Initialize map
    for (let i = 1; i <= quantity; i++) {
      unitAssignments[i] = {
        core_tester: "",
        secondary_tester: "",
        primary_tester: "",
        final_tester: "",
        pt_tester: ""
      };
    }

    if (assignments && assignments.length > 0) {
      assignments.forEach(assign => {
        const { stage, testerName, unitRange } = assign; // stage: 'core', 'secondary', etc.
        const from = parseInt(unitRange.from);
        const to = parseInt(unitRange.to) || quantity; // Default to max if empty

        for (let u = from; u <= to; u++) {
          if (unitAssignments[u]) {
            unitAssignments[u][`${stage}_tester`] = testerName;
          }
        }
      });
    }

    // Determine Start Stage based on Assignments
    let startStage = 'core';
    let hasCore = false;
    let hasSecondary = false;

    if (assignments && assignments.length > 0) {
      hasCore = assignments.some(a => a.stage === 'core');
      hasSecondary = assignments.some(a => a.stage === 'secondary');
    }

    if (order.transformerType === 'PT') {
      startStage = 'pt_pretest';
      order.currentStage = 'pt_pretest';
      await order.save();
    } else if (!hasCore && hasSecondary) {
      startStage = 'secondary';
      order.currentStage = 'secondary';
      order.completionStages.core = true;
      await order.save();
      console.log(`[Generate] Skipping Core stage. Starting at Secondary.`);
    }

    console.log(`[Generate] Generating ${quantity} transformers for ${jobId} with assignments mapping.`);

    for (let i = 1; i <= quantity; i++) {
      const uniqueId = `TR-${jobId}-${String(i).padStart(3, '0')}`;

      // Construct Initial History
      const initialHistory = {
        secondary_login: { status: 'Pending' },
        primary_login: { status: 'Pending' },
        final_test_login: { status: 'Pending' }
      };

      transformers.push({
        uniqueId,
        orderId: order._id, // Link to Parent Order
        currentStage: startStage, // Dynamic Start Stage
        testHistory: initialHistory,
        assignments: unitAssignments[i],
        jobId: jobId,
      });
    }

    // Bulk Insert for performance
    await TransformerModel.insertMany(transformers);
    console.log(`Successfully generated ${quantity} transformers for ${jobId}`);

    // --- CREATE NOTIFICATIONS ---
    if (assignments && assignments.length > 0) {
      const uniqueTesters = [...new Set(assignments.filter(a => a.stage === startStage).map(a => a.testerName))];

      const notificationPromises = uniqueTesters.map(tester => {
        return new NotificationModel({
          recipientRole: startStage,
          recipientName: tester,
          message: `New testing task assigned: ${quantity} units for ${order.clientName} (Job: ${jobId})`,
          orderId: order._id,
          jobId: jobId,
          type: "ASSIGNMENT"
        }).save();
      });
      await Promise.all(notificationPromises);
      console.log(`Created ${uniqueTesters.length} notifications for ${startStage} testers.`);
    }

  } catch (error) {
    console.error("Error generating transformers:", error);
    throw error; // Re-throw to be caught by caller
  }
};

// POST /api/create-order
exports.createOrder = async (req, res) => {
  try {
    const jobSeq = await getNextSequenceValue("job_sequence");
    const currentYear = new Date().getFullYear();
    const jobId = `JOB-${currentYear}-${jobSeq.toString().padStart(3, '0')}`;

    const isDirectApproval = req.body.bypassApproval === true || req.body.bypassApproval === 'true';

    const imagesArray = req.files ? req.files.map(file => ({
      url: file.path,
      public_id: file.filename
    })) : [];

    const parsedBody = { ...req.body };
    try {
      if (req.body.coreDetails && typeof req.body.coreDetails === 'string') {
        parsedBody.coreDetails = JSON.parse(req.body.coreDetails);
      }
      if (req.body.assignments && typeof req.body.assignments === 'string') {
        parsedBody.assignments = JSON.parse(req.body.assignments);
      }
      if (req.body.ratio && typeof req.body.ratio === 'string') {
        parsedBody.ratio = JSON.parse(req.body.ratio);
      }
      if (req.body.coreVendors && typeof req.body.coreVendors === 'string') {
        parsedBody.coreVendors = JSON.parse(req.body.coreVendors);
      }
    } catch (e) {
      console.error("Body parsing error:", e);
    }

    const newOrder = new OrderModel({
      ...parsedBody,
      images: imagesArray,
      jobId: jobId,
      isApproved: isDirectApproval,
      isRead: !isDirectApproval,
      status: isDirectApproval ? "In Progress" : "Pending Approval"
    });

    console.log(`[CreateOrder] Payload for ${jobId}:`, JSON.stringify(req.body, null, 2));

    const savedOrder = await newOrder.save();

    if (isDirectApproval) {
      await generateTransformersForOrder(savedOrder);
    }

    res.status(201).json({
      success: true,
      message: isDirectApproval
        ? `Order created and ${savedOrder.quantity} units generated.`
        : "Order submitted to Admin for approval.",
      jobId: savedOrder.jobId
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    res.status(500).json({ success: false, error: error.message, details: error.errors });
  }
};

// PUT /api/orders/:orderId/approve
exports.approveOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await OrderModel.findById(orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.isApproved) return res.status(400).json({ message: "Already approved" });

    order.isApproved = true;
    order.status = "In Progress";
    await order.save();

    await generateTransformersForOrder(order);

    res.status(200).json({
      success: true,
      message: `Approved. ${order.quantity} units generated for ${order.jobId}.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper: check if a specific testing stage is completed for a transformer
const isStageCompleted = (transformer, stage) => {
  const currentStage = transformer.currentStage;
  if (stage === 'core') {
    return currentStage !== 'core';
  }
  if (stage === 'secondary') {
    return !['core', 'secondary', 'secondary_failed', 'admin_review'].includes(currentStage);
  }
  if (stage === 'primary') {
    return !['core', 'secondary', 'secondary_failed', 'primary', 'admin_review'].includes(currentStage);
  }
  if (stage === 'heating') {
    return !['core', 'secondary', 'secondary_failed', 'primary', 'heating', 'admin_review'].includes(currentStage);
  }
  if (stage === 'final') {
    return currentStage === 'shipped' || transformer.testHistory?.final_test?.status === 'Completed';
  }
  if (stage === 'pt_pretest') {
    return currentStage !== 'pt_pretest';
  }
  if (stage === 'pt') {
    return !['pt_pretest', 'pt', 'admin_review'].includes(currentStage);
  }
  return false;
};

// PUT /api/orders/:orderId
exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;

    const existingOrder = await OrderModel.findById(orderId);
    if (!existingOrder) return res.status(404).json({ message: "Order not found" });

    const oldQuantity = existingOrder.quantity || 0;
    const newQuantity = updates.quantity ? parseInt(updates.quantity) : oldQuantity;

    const order = await OrderModel.findByIdAndUpdate(
      orderId,
      { $set: updates },
      { new: true }
    );

    if (newQuantity !== oldQuantity && existingOrder.isApproved) {
      console.log(`[UpdateOrder] Quantity changed from ${oldQuantity} to ${newQuantity}. Syncing transformers...`);
      
      if (newQuantity > oldQuantity) {
        for (let i = oldQuantity + 1; i <= newQuantity; i++) {
          const uniqueId = `TR-${order.jobId}-${String(i).padStart(3, '0')}`;
          
          const existing = await TransformerModel.findOne({ uniqueId });
          if (existing) continue;

          let startStage = order.transformerType === 'PT' ? 'pt_pretest' : 'core';
          
          const newTransformer = new TransformerModel({
            orderId: order._id,
            uniqueId: uniqueId,
            jobId: order.jobId,
            currentStage: startStage,
            testHistory: {
              core_test: { status: 'Pending' },
              secondary_test: { status: 'Pending' },
              primary_test: { status: 'Pending' },
              final_test: { status: 'Pending' }
            },
            assignments: {} 
          });
          
          if (order.assignments && order.assignments.length > 0) {
            order.assignments.forEach(assign => {
              const from = parseInt(assign.unitRange.from);
              const to = parseInt(assign.unitRange.to) || newQuantity;
              if (i >= from && i <= to) {
                newTransformer.assignments[`${assign.stage}_tester`] = assign.testerName;
              }
            });
          }

          await newTransformer.save();
        }

        if (order.assignments && order.assignments.length > 0) {
          const startStage = order.transformerType === 'PT' ? 'pt_pretest' : 'core';
          const uniqueTesters = [...new Set(order.assignments.filter(a => a.stage === startStage).map(a => a.testerName))];
          
          for (const tester of uniqueTesters) {
            await new NotificationModel({
              recipientRole: startStage,
              recipientName: tester,
              message: `Updated order: ${newQuantity - oldQuantity} new units added for ${order.clientName} (Job: ${order.jobId})`,
              orderId: order._id,
              jobId: order.jobId,
              type: "ASSIGNMENT"
            }).save();
          }
        }
      } else {
        for (let i = oldQuantity; i > newQuantity; i--) {
          const uniqueId = `TR-${order.jobId}-${String(i).padStart(3, '0')}`;
          
          await TransformerModel.deleteOne({ uniqueId });
          await MeteringCoreTestModel.deleteMany({ uniqueId });
          await ProtectionCoreTestModel.deleteMany({ uniqueId });
          await SecondaryMeteringTestModel.deleteMany({ uniqueId });
          
          await HeatingRecordModel.updateMany(
            { orderId: order._id },
            { $pull: { blocks: { transformerId: uniqueId } } }
          );

          await FailedCoreModel.deleteMany({ uniqueId });
          await FailedTransformerModel.deleteMany({ uniqueId });
        }
      }
    }

    // Dynamic Worker Assignment Sync for remaining tests of existing units (Only for approved orders)
    if (updates.assignments && existingOrder.isApproved) {
      const remainingLimit = Math.min(oldQuantity, newQuantity);
      const transformers = await TransformerModel.find({ orderId: order._id });
      
      for (const t of transformers) {
        const parts = t.uniqueId.split('-');
        const unitNumber = parseInt(parts[parts.length - 1], 10);
        
        if (unitNumber <= remainingLimit) {
          if (!t.assignments) t.assignments = {};
          
          const stages = ["core", "secondary", "primary", "heating", "final", "pt", "pt_pretest"];
          let isModified = false;
          
          for (const stage of stages) {
            if (!isStageCompleted(t, stage)) {
              // Find matching assignment in updated assignments list
              const matchingAssign = updates.assignments.find(a => 
                a.stage === stage && 
                unitNumber >= parseInt(a.unitRange.from, 10) && 
                unitNumber <= (parseInt(a.unitRange.to, 10) || newQuantity)
              );
              
              const key = `${stage}_tester`;
              const oldTester = t.assignments[key];
              const newTester = matchingAssign ? matchingAssign.testerName : "";
              
              if (oldTester !== newTester) {
                t.assignments[key] = newTester;
                isModified = true;
              }
            }
          }
          
          if (isModified) {
            t.markModified('assignments');
            await t.save();
          }
        }
      }
    }

    // Recalculate completionStages & currentStage based on all transformers for this order (Only for approved orders)
    if (existingOrder.isApproved) {
      const allTransformers = await TransformerModel.find({ orderId: order._id });
      const stages = ["core", "secondary", "primary", "heating", "final", "pt", "pt_pretest"];
      
      const newCompletionStages = {
        core: true,
        secondary: true,
        primary: true,
        heating: true,
        final: true,
        pt: true,
        pt_pretest: true
      };
      
      for (const t of allTransformers) {
        for (const stage of stages) {
          if (!isStageCompleted(t, stage)) {
            newCompletionStages[stage] = false;
          }
        }
      }
      
      // Determine earliest uncompleted stage among all units
      let earliestStage = order.transformerType === 'PT' ? 'pt_pretest' : 'core';
      if (order.transformerType === 'PT') {
        if (!newCompletionStages.pt_pretest) earliestStage = 'pt_pretest';
        else if (!newCompletionStages.pt) earliestStage = 'pt';
        else earliestStage = 'completed';
      } else {
        if (!newCompletionStages.core) earliestStage = 'core';
        else if (!newCompletionStages.secondary) earliestStage = 'secondary';
        else if (!newCompletionStages.primary) earliestStage = 'primary';
        else if (!newCompletionStages.heating) earliestStage = 'heating';
        else if (!newCompletionStages.final) earliestStage = 'final';
        else earliestStage = 'completed';
      }
      
      order.completionStages = newCompletionStages;
      order.currentStage = earliestStage;
      if (!newCompletionStages.core) {
        order.approved = false;
        if (order.status === "Core Testing Completed" || order.status === "COMPLETED") {
          order.status = "In Progress";
        }
      }
      await order.save();
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully and transformers synced",
      order
    });
  } catch (error) {
    console.error("Update Order Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/orders/:orderId
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await OrderModel.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.images && order.images.length > 0) {
      const deletePromises = order.images.map(img => {
        if (img.public_id) {
          return cloudinary.uploader.destroy(img.public_id).catch(err => {
            console.error(`[DeleteOrder] Cloudinary cleanup failed for ${img.public_id}:`, err);
            return null;
          });
        }
        return Promise.resolve();
      });
      await Promise.all(deletePromises);
    }

    await TransformerModel.deleteMany({ orderId: order._id });
    await NotificationModel.deleteMany({ orderId: order._id });
    await FailedCoreModel.deleteMany({ orderId: order._id });
    await FailedTransformerModel.deleteMany({ orderId: order._id });
    await ReadyTransformerModel.deleteMany({ orderId: order._id });
    await SecondaryMeteringTestModel.deleteMany({ orderId: order._id });
    await MeteringCoreTestModel.deleteMany({ orderId: order._id });
    await ProtectionCoreTestModel.deleteMany({ orderId: order._id });
    await HeatingRecordModel.deleteMany({ orderId: order._id });

    await OrderModel.findByIdAndDelete(orderId);

    res.status(200).json({
      success: true,
      message: "Order, associated transformers, and images deleted successfully"
    });
  } catch (error) {
    console.error("Delete Order Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/orders/:orderId/reassign
exports.reassignTester = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { stage, testerName } = req.body;

    if (!stage || !testerName) {
      return res.status(400).json({ message: "Stage and Tester Name are required" });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const outputAssignments = order.assignments.filter(a => a.stage !== stage);

    outputAssignments.push({
      testerName: testerName,
      stage: stage,
      unitRange: { from: 1, to: order.quantity },
      status: "Assigned"
    });

    order.assignments = outputAssignments;
    await order.save();

    const transformers = await TransformerModel.find({ orderId: order._id });

    const updatePromises = transformers.map(t => {
      if (!t.assignments) t.assignments = {};
      t.assignments[`${stage}_tester`] = testerName;
      return t.save();
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `Reassigned ${stage} stage to ${testerName}`,
      order
    });
  } catch (error) {
    console.error("Reassignment Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/orders/:orderId/update-timer
exports.updateOrderTimer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, coreType } = req.body;

    if (!action || !coreType) {
      return res.status(400).json({ success: false, message: "action and coreType are required" });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.stageTracking) order.stageTracking = {};
    if (!order.stageTracking.core) order.stageTracking.core = {};
    if (!order.stageTracking.core[coreType]) {
      order.stageTracking.core[coreType] = {
        accumulatedTimeMs: 0,
        status: "Pending",
        isAcknowledged: false
      };
    }

    const stageData = order.stageTracking.core[coreType];

    if (action === 'start') {
      if (!stageData.allocatedMinutes) {
        const { SettingsModel } = require('../models/SettingsModel');
        let timeSetting = await SettingsModel.findOne({ key: 'ct_core_minutes' });
        if (!timeSetting) {
          timeSetting = await SettingsModel.create({ key: 'ct_core_minutes', value: 3 });
        }
        
        const coresPerTransformer = (order.coreDetails || []).filter(
          (core) => (core.coreType || core.type).toLowerCase() === coreType.toLowerCase()
        ).length || 1;
        const totalRowsNeeded = (order.quantity || 1) * coresPerTransformer;
        
        stageData.allocatedMinutes = totalRowsNeeded * parseInt(timeSetting.value, 10);
      }

      if (stageData.status !== 'In Progress') {
        stageData.status = 'In Progress';
        stageData.startTime = new Date();
        if (stageData.accumulatedTimeMs === undefined) {
          stageData.accumulatedTimeMs = 0;
        }
      }
    } else if (action === 'pause') {
      if (stageData.status === 'In Progress' && stageData.startTime) {
        const elapsedMs = new Date() - new Date(stageData.startTime);
        stageData.accumulatedTimeMs = (stageData.accumulatedTimeMs || 0) + elapsedMs;
        stageData.status = 'Paused';
        stageData.startTime = null;
      }
    } else if (action === 'complete') {
      if (stageData.status === 'In Progress' && stageData.startTime) {
        const elapsedMs = new Date() - new Date(stageData.startTime);
        stageData.accumulatedTimeMs = (stageData.accumulatedTimeMs || 0) + elapsedMs;
      }
      stageData.status = 'Completed';
      stageData.startTime = null;
    }

    await OrderModel.findByIdAndUpdate(orderId, { stageTracking: order.stageTracking });

    res.json({
      success: true,
      data: {
        startTime: stageData.startTime,
        accumulatedTimeMs: stageData.accumulatedTimeMs,
        allocatedMinutes: stageData.allocatedMinutes,
        status: stageData.status
      }
    });
  } catch (error) {
    console.error("Error updating order timer:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/orders/:orderId
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const mongoose = require('mongoose');
    let order = null;

    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await OrderModel.findById(orderId);
    }

    if (!order) {
      order = await OrderModel.findOne({ jobId: orderId });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Fetch Order Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /allorders
exports.getAllOrders = async (req, res) => {
  try {
    let orders = await OrderModel.find({}).lean().limit(1000);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

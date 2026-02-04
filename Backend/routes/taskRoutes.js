const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { TransformerModel } = require('../models/TransformerModel');

// router.get("/assigneed_orders", isAuthenticated, async (req, res) => {
//     console.log("Session:", req.session);
//     console.log("User:", req.user);

//     // 1. Check if user is actually attached to the request
//     if (!req.user) return res.status(401).json({ message: "Not Authenticated" });

//     const { department, fullName } = req.user;

//     // 2. Map Department to DB Stage
//     // 'Core Test' maps to 'core' based on the prompt's requirement for matching TransformerSchema short names
//     const stageMap = {
//         "Core Test": "core",
//         "Secondary Test": "secondary",
//         "Primary Test": "primary",
//         "Final Test": "final"
//     };

//     const stage = stageMap[department]; // e.g., 'core'
//     if (!stage) return res.status(400).json({ message: "Invalid Department for testing" });

//     try {
//         // 3. Find and Filter
//         // Fetch transformers where currentStage matches the user's mapped stage
//         const tasks = await TransformerModel.find({ currentStage: stage }).populate("orderId");

//         // Filter results: only transformers where req.user.fullName matches the corresponding tester field in Order.assignments
//         const filteredTasks = tasks.filter(task => {
//             if (!task.orderId || !task.orderId.assignments) return false;

//             // assignment key is like 'core_tester', 'secondary_tester'
//             const assignmentKey = `${stage}_tester`;
//             return task.orderId.assignments[assignmentKey] === fullName;
//         });

//         res.json(filteredTasks);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });



const { OrderModel } = require('../models/OrderModel');

router.get("/assigneed_orders", isAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    const stageMap = {
      "Core Test": "core",
      "Secondary Test": "secondary",
      "Primary Test": "primary",
      "Final Test": "final"
    };

    let stageKey = stageMap[user.department];

    // Admin/Management Bypass
    const adminDepartments = ["Management", "Office", "Admin"];
    if (adminDepartments.includes(user.department) || user.designation === "Admin") {
      const query = req.query.stage ? { currentStage: req.query.stage } : { currentStage: "core" };
      const orders = await OrderModel.find(query).sort({ updatedAt: -1 });
      return res.json(orders);
    }

    if (!stageKey) {
      return res.status(400).json({ message: "Invalid Department for testing" });
    }

    // -------------------------------------------------------------------------
    // GRANULAR ASSIGNMENT LOGIC (Per User Request)
    // -------------------------------------------------------------------------

    // 1. Identify the Assignment Field
    const assignmentField = `assignments.${stageKey}_tester`;
    const namesToCheck = [user.name, user.fullName, (user.name || '').trim(), (user.fullName || '').trim()].filter(Boolean);

    // Use $in to match any variation of the user's name
    // Also Ensure currentStage matches the user's department/role stage
    const activeAssignmentQuery = {
      [assignmentField]: { $in: namesToCheck },
      currentStage: stageKey
    };

    // 2. Find Assigned Transformers
    // We look for transformers assigned to this user in the current stage
    const { TransformerModel } = require('../models/TransformerModel');
    const assignedTransformers = await TransformerModel.find(activeAssignmentQuery).select('orderId uniqueId');

    // Group by Order ID to know which specific units are assigned for each order
    // Map: OrderID (string) -> Array of UniqueIDs
    const orderToUnitMap = {};
    assignedTransformers.forEach(t => {
      if (!t.orderId) return;
      const oId = t.orderId.toString();
      if (!orderToUnitMap[oId]) {
        orderToUnitMap[oId] = [];
      }
      orderToUnitMap[oId].push(t.uniqueId);
    });

    const activeOrderIds = Object.keys(orderToUnitMap);

    // -------------------------------------------------------------------------
    // HISTORY LOGIC (Remains similar but ensures robustness)
    // -------------------------------------------------------------------------
    let historyOrderIds = [];
    if (stageKey === 'core') {
      // ... existing history logic ...
      // (We keep the existing logic for history finding as it queries Test Models directly)
      const { MeteringCoreTestModel } = require('../models/MeteringCoreTestModel');
      const { ProtectionCoreTestModel } = require('../models/ProtectionCoreTestModel');

      const userTestQuery = { testedBy: { $in: namesToCheck } };

      const [meteringTests, protectionTests] = await Promise.all([
        MeteringCoreTestModel.find(userTestQuery).select('orderId'),
        ProtectionCoreTestModel.find(userTestQuery).select('orderId')
      ]);
      const allTests = [...meteringTests, ...protectionTests];
      historyOrderIds = allTests.map(t => t.orderId);
    }
    else if (stageKey === 'secondary') {
      const { SecondaryMeteringTestModel } = require('../models/SecondaryMeteringTestModel');
      // Secondary tests don't have direct orderId, we might need to look up via Transformers 
      // OR filtering happens later. For 'history' list, we usually show orders where they DID something.
      // For simplicity, we might rely on the 'active' list transitioning to history or use the efficient check later.
      // Let's assume for now History in Secondary finds orders via the Transformers they tested.

      // Find distinct transformers tested by user
      const testedTransformers = await SecondaryMeteringTestModel.find({ tester: { $in: namesToCheck } }).distinct('uniqueId');
      if (testedTransformers.length > 0) {
        const relatedOrders = await TransformerModel.find({ uniqueId: { $in: testedTransformers } }).distinct('orderId');
        historyOrderIds = relatedOrders;
      }
    }

    // 3. Combine Queries based on Filter
    const filterType = req.query.type; // 'active' or 'history'
    let finalOrderQuery = {};

    if (filterType === 'active') {
      finalOrderQuery = { _id: { $in: activeOrderIds } };
      // If filtering by stage specifically
      if (req.query.stage) {
        finalOrderQuery.currentStage = req.query.stage;
      } else {
        // Implicitly we are likely in the stage because we queried transformers by stageKey
        // But the Order itself might hold a status. 
        // We prioritize the Transformer's presence in the query which checked currentStage=stageKey.
      }
    } else if (filterType === 'history') {
      finalOrderQuery = {
        $or: [
          { _id: { $in: historyOrderIds } },
          { "assignments.core_tester": { $in: namesToCheck }, status: "Core Testing Completed" }, // Legacy Object check
          // Support for Array-based assignments (New Granular System)
          {
            assignments: {
              $elemMatch: {
                testerName: { $in: namesToCheck },
                stage: "core"
              }
            },
            status: "Core Testing Completed"
          }
        ]
      };
    } else {
      // Combined
      finalOrderQuery = {
        $or: [
          { _id: { $in: activeOrderIds } },
          { _id: { $in: historyOrderIds } }
        ]
      };
    }

    const orders = await OrderModel.find(finalOrderQuery).lean().sort({ createdAt: -1 });

    // 4. Enrich Orders with "AssignedUnits" list
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      const oId = order._id.toString();
      // Attach the specific units assigned to this user
      // If history, this map might be empty, which is fine (all units might be viewable or logic handled elsewhere)
      const assignedUnitIds = orderToUnitMap[oId] || [];

      let stats = {
        testsCompleted: 0,
        passed: 0,
        failed: 0,
        userReadings: []
      };

      if (stageKey === 'core') {
        const { MeteringCoreTestModel } = require('../models/MeteringCoreTestModel');
        const { ProtectionCoreTestModel } = require('../models/ProtectionCoreTestModel');

        // Find tests for this order (fetch ALL documents to ensure we find the user's)
        const tests = await Promise.all([
          MeteringCoreTestModel.find({ orderId: order._id }).lean(),
          ProtectionCoreTestModel.find({ orderId: order._id, coreType: 'Protection' }).lean(),
          ProtectionCoreTestModel.find({ orderId: order._id, coreType: 'PS' }).lean()
        ]);

        // Flatten and filter for THIS user (Case-Insensitive)
        const currentUserName = (user.name || user.fullName || '').trim().toLowerCase();

        tests.flat().filter(t => {
          if (!t || !t.testedBy) return false;
          return t.testedBy.trim().toLowerCase() === currentUserName;
        }).forEach(testDoc => {
          if (testDoc.readings) {
            testDoc.readings.forEach(r => {
              // Only count valid readings (with internalCoreNo)
              if (r.internalCoreNo) {
                stats.testsCompleted++;

                // Robust Outcome Check: Support 'P', 'Pass', 'F', 'Fail'
                const rawOutcome = (r.result || r.remark || r.status || '').toUpperCase();
                let outcome = rawOutcome; // Default to raw if no match

                if (rawOutcome === 'P' || rawOutcome === 'PASS') {
                  stats.passed++;
                  outcome = 'P';
                }
                else if (rawOutcome === 'F' || rawOutcome === 'FAIL') {
                  stats.failed++;
                  outcome = 'F';
                }

                let readingDisplay = '';
                if (testDoc.coreType === 'Metering' && r.measuredMa && Array.isArray(r.measuredMa)) {
                  readingDisplay = r.measuredMa.join(', ');
                } else if (r.value !== undefined) {
                  readingDisplay = String(r.value);
                }

                stats.userReadings.push({
                  coreId: r.internalCoreNo,
                  date: r.date,
                  result: outcome,
                  type: testDoc.coreType,
                  readingValue: readingDisplay
                });
              }
            });
          }
        });
      } else if (stageKey === 'secondary') {
        // SECONDARY STATS AGGREGATION
        const { SecondaryMeteringTestModel } = require('../models/SecondaryMeteringTestModel');

        // Find tests for this order (linked via uniqueId -> Order or just rely on manual filtering if orderId not present)
        // Note: SecondaryMeteringModel has 'uniqueId' (Transformer ID), not direct 'orderId'.
        // We need to resolve which transformers belong to this order.
        // But wait, the `TransformerModel` has `orderId`.

        // 1. Get all transformers for this order to filter the secondary tests
        const { TransformerModel } = require('../models/TransformerModel');
        const orderTransformers = await TransformerModel.find({ orderId: order._id }).select('uniqueId');
        const transformerIds = orderTransformers.map(t => t.uniqueId);

        if (transformerIds.length > 0) {
          // 2. Fetch all secondary tests for these transformers
          const secondaryTests = await SecondaryMeteringTestModel.find({
            uniqueId: { $in: transformerIds }
          }).lean();

          const currentUserName = (user.name || user.fullName || '').trim().toLowerCase();

          secondaryTests.filter(t => {
            if (!t || !t.tester) return false;
            return t.tester.trim().toLowerCase() === currentUserName;
          }).forEach(testDoc => {
            stats.testsCompleted++;
            // Secondary tests are usually measurements. Check 'status' field if exists, else default.
            const status = (testDoc.status || 'Completed').toUpperCase();

            if (status === 'COMPLETED' || status === 'PASS') {
              stats.passed++;
            } else if (status === 'FAIL') {
              stats.failed++;
            }

            stats.userReadings.push({
              coreId: `${testDoc.uniqueId} - ${testDoc.coreId}`, // Distinct ID for secondary
              date: testDoc.testDate || testDoc.createdAt,
              result: status,
              type: 'Secondary Metering'
            });
          });
        }
      }

      return { ...order, userStats: stats, assignedUnitIds: assignedUnitIds };
    }));

    res.json(enrichedOrders);

  } catch (err) {
    console.error("Error in /assigned_orders:", err);
    res.status(500).json({ error: err.message });
  }
});

// Backend Route: GET /orders/:orderId/transformers
// Fetches all transformers associated with a specific order
router.get('/orders/:orderId/transformers', isAuthenticated, async (req, res) => {
  try {
    const { TransformerModel } = require('../models/TransformerModel');
    const transformers = await TransformerModel.find({ orderId: req.params.orderId });
    res.json(transformers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Backend Route: PUT /api/core-tests/approve/:orderId
// This route is called when the user clicks "Approve & Send to Secondary"
// It moves the order out of the "Core" stage.
router.put('/core-tests/approve/:orderId', async (req, res) => {
  try {
    // 1. Fetch the Order with details
    const order = await OrderModel.findById(req.params.orderId).lean();
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 2. Calculate Total Required Tests
    // Logic matches CoreTypeSelection.tsx: Quantity * Sum(CoresPerType)
    const validQuantity = order.quantity || order.transformerQuantity || 0;
    const details = order.coreDetails || order.coreConfiguration || [];

    // We need to count unique TESTABLE items. 
    // Usually: CoreType 'Metering' x 1, 'Protection' x 1, 'PS' x 1 etc.
    // Let's sum up how many rows are expected.
    let totalRowsRequired = 0;
    const coreTypes = ['Metering', 'Protection', 'PS']; // Simplified check for now

    // Better Approach: Iterate existing Test Types in config
    const uniqueTypes = new Set();
    details.forEach(c => {
      const type = c.coreType || c.type;
      const isPS = type === 'Protection' && (c.iexLimit || c.leLimit || c.class === 'PS' || (c.description && c.description.includes('PS')));
      if (isPS) uniqueTypes.add('PS');
      else if (type === 'Protection') uniqueTypes.add('Protection');
      else uniqueTypes.add(type);
    });

    // Helper: Count instances of a type in config
    const getCountForType = (t) => {
      return details.filter(c => {
        const type = c.coreType || c.type;
        const isPS = type === 'Protection' && (c.iexLimit || c.leLimit || c.class === 'PS' || (c.description && c.description.includes('PS')));
        if (t === 'PS') return isPS || type === 'PS';
        if (t === 'Protection') return type === 'Protection' && !isPS;
        return type === t;
      }).length;
    };

    totalRowsRequired = 0;
    uniqueTypes.forEach(t => {
      totalRowsRequired += (validQuantity * getCountForType(t));
    });

    // 3. Count Actual Completed Tests in DB
    const { MeteringCoreTestModel } = require('../models/MeteringCoreTestModel');
    const { ProtectionCoreTestModel } = require('../models/ProtectionCoreTestModel');

    const mTests = await MeteringCoreTestModel.find({ orderId: order._id }).lean();
    const pTests = await ProtectionCoreTestModel.find({ orderId: order._id }).lean();

    let completedCount = 0;

    // Count Metering Readings
    mTests.forEach(doc => {
      if (doc.readings) {
        completedCount += doc.readings.filter(r => r.internalCoreNo && (r.result || r.remark)).length;
      }
    });

    // Count Protection/PS Readings
    pTests.forEach(doc => {
      if (doc.readings) {
        completedCount += doc.readings.filter(r => r.internalCoreNo && (r.result || r.remark)).length;
      }
    });

    console.log(`Approval Check: Required ${totalRowsRequired}, Found ${completedCount}`);

    // 4. Conditional Approval
    if (completedCount < totalRowsRequired) {
      // DO NOT MOVE STAGE yet.
      // Maybe just update status to "In Progress" explicitly if needed, or do nothing.
      // returning 200 with a specific message allows frontend to say "Saved, Awaiting others"
      return res.status(200).json({
        success: true,
        message: `Your part is acknowledged. Waiting for other testers to complete. (${completedCount}/${totalRowsRequired} Completed)`,
        notMoved: true
      });
    }

    // 5. If All Complete, Move to Secondary
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      req.params.orderId,
      {
        $set: {
          currentStage: "secondary",
          status: "Core Testing Completed",
          "completionStages.core": true
        }
      },
      { new: true }
    );
    res.status(200).json({ success: true, data: updatedOrder, moved: true });
  } catch (err) {
    console.error("Approval Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

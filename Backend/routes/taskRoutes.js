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
    // Now querying the TRANSFORMER's assignments object directly
    const assignmentField = `assignments.${stageKey}_tester`;
    const namesToCheck = [user.name, user.fullName, (user.name || '').trim(), (user.fullName || '').trim()].filter(Boolean);

    // Use $in to match any variation of the user's name
    // Also Ensure currentStage matches the user's department/role stage
    // Note: We use the TransformerModel directly now.
    // MODIFIED: Allow UNASSIGNED transformers (null, empty, or missing) to be seen by everyone in that stage
    const activeAssignmentQuery = {
      currentStage: stageKey,
      $or: [
        { [assignmentField]: { $in: namesToCheck } },
        { [assignmentField]: { $exists: false } },
        { [assignmentField]: null },
        { [assignmentField]: "" }
      ]
    };

    // 2. Find Assigned Transformers directly
    const { TransformerModel } = require('../models/TransformerModel');
    const assignedTransformers = await TransformerModel.find(activeAssignmentQuery).select('orderId uniqueId');

    console.log("----- DEBUG ASSIGNMENTS -----");
    console.log("User:", namesToCheck);
    console.log("Stage:", stageKey);
    console.log("Query:", JSON.stringify(activeAssignmentQuery));
    console.log("Found Transformers matched:", assignedTransformers.length);
    if (assignedTransformers.length > 0) {
      console.log("Sample ID:", assignedTransformers[0].uniqueId);
    }
    console.log("-----------------------------");

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
      // 1. Orders from Assigned Transformers
      const transformerBasedQuery = { _id: { $in: activeOrderIds } };

      // 2. Direct Order Assignment (Fallback/Robustness)
      const directAssignmentQuery = {
        currentStage: stageKey,
        assignments: {
          $elemMatch: {
            testerName: { $in: namesToCheck },
            stage: stageKey
          }
        },
        isApproved: true // Only show orders that have been approved by Admin
        // status: { $regex: /In Progress/i } // Optional: Filter by status if needed
      };

      // Combine: Show order if (Transformers are assigned OR Order says I'm assigned)
      finalOrderQuery = {
        $or: [
          transformerBasedQuery,
          directAssignmentQuery
        ]
      };

      // If filtering by stage specifically (User override)
      if (req.query.stage) {
        finalOrderQuery.currentStage = req.query.stage;
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

// ✅ FETCH SINGLE TRANSFORMER
router.get('/transformers/:uniqueId', isAuthenticated, async (req, res) => {
  try {
    const { TransformerModel } = require('../models/TransformerModel');
    // Find by uniqueId (string ID)
    const transformer = await TransformerModel.findOne({ uniqueId: req.params.uniqueId });
    if (!transformer) return res.status(404).json({ message: "Transformer not found" });

    res.json(transformer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ FETCH COMPLETED REPORTS FOR SECONDARY TESTER
router.get('/secondary/reports', isAuthenticated, async (req, res) => {
  try {
    const { TransformerModel } = require('../models/TransformerModel');
    const user = req.user;
    const currentUserName = (user.name || user.fullName || '').trim();

    console.log("Fetching secondary reports for:", currentUserName);

    // Find transformers where this user marked secondary test as Completed
    // Construct a list of possible names to search for
    const namesToCheck = [user.name, user.fullName, user.username].filter(n => n && n.trim().length > 0).map(n => n.trim());
    const nameRegexes = namesToCheck.map(n => new RegExp(n, 'i'));

    console.log("Fetching secondary reports for names:", namesToCheck);

    const query = {
      // User Request: Show ONLY "Completed" reports (approved by tester).
      // STRICTLY match the 'tester' field (no assignment fallback) to ensure they only see what THEY tested.
      // Excludes "In Progress" and "Pending".
      "testHistory.secondary_test.status": "Completed",
      $or: [
        ...nameRegexes.map(r => ({ "testHistory.secondary_test.tester": { $regex: r } }))
      ]
    };

    const transformers = await TransformerModel.find(query).sort({ updatedAt: -1 }).populate('orderId');

    const fs = require('fs');
    fs.appendFileSync('d:/Advent/Backend/debug_api_log.txt',
      `\n[${new Date().toISOString()}] User: '${currentUserName}' | Found: ${transformers.length} reports | Query: ${JSON.stringify(query)}`
    );

    console.log(`Found ${transformers.length} completed reports for ${currentUserName}`);
    res.json(transformers);
  } catch (err) {
    console.error("Error fetching secondary reports:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ FETCH COMPLETED REPORTS FOR AFTER PRIMARY TESTER
router.get('/after-primary/reports', isAuthenticated, async (req, res) => {
  try {
    const { TransformerModel } = require('../models/TransformerModel');
    const user = req.user;
    const currentUserName = (user.name || user.fullName || '').trim();

    console.log("Fetching after-primary reports for:", currentUserName);

    // Find transformers where this user marked after-primary test as Completed
    const namesToCheck = [user.name, user.fullName, user.username].filter(n => n && n.trim().length > 0).map(n => n.trim());
    const nameRegexes = namesToCheck.map(n => new RegExp(n, 'i'));

    const query = {
      // User Request: Show ONLY "Completed" reports (approved by tester).
      "testHistory.primary_test.status": "Completed",
      $or: [
        ...nameRegexes.map(r => ({ "testHistory.primary_test.tester": { $regex: r } }))
      ]
    };

    const transformers = await TransformerModel.find(query).sort({ updatedAt: -1 }).populate('orderId');

    console.log(`Found ${transformers.length} completed after-primary reports for ${currentUserName}`);
    res.json(transformers);
  } catch (err) {
    console.error("Error fetching after-primary reports:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ FETCH COMPLETED REPORTS FOR FINAL TESTER
router.get('/final/reports', isAuthenticated, async (req, res) => {
  try {
    const { TransformerModel } = require('../models/TransformerModel');
    const user = req.user;
    const currentUserName = (user.name || user.fullName || '').trim();

    console.log("Fetching final reports for:", currentUserName);

    // Find transformers where this user marked final test as Completed
    const namesToCheck = [user.name, user.fullName, user.username].filter(n => n && n.trim().length > 0).map(n => n.trim());
    const nameRegexes = namesToCheck.map(n => new RegExp(n, 'i'));

    const query = {
      // User Request: Show ONLY "Completed" reports (approved by tester).
      "testHistory.final_test.status": "Completed",
      $or: [
        ...nameRegexes.map(r => ({ "testHistory.final_test.tester": { $regex: r } }))
      ]
    };

    const transformers = await TransformerModel.find(query).sort({ updatedAt: -1 }).populate('orderId');

    console.log(`Found ${transformers.length} completed final reports for ${currentUserName}`);
    res.json(transformers);
  } catch (err) {
    console.error("Error fetching final reports:", err);
    res.status(500).json({ error: err.message });
  }
});




// ✅ FETCH ALL ORDERS (ADMIN VIEW)
router.get('/admin/orders', isAuthenticated, async (req, res) => {
  try {
    const { OrderModel } = require('../models/OrderModel');
    // Fetch all orders, sorted by newest first
    const orders = await OrderModel.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ADMIN NOTIFICATIONS
router.get('/admin/notifications', isAuthenticated, async (req, res) => {
  try {
    const { OrderModel } = require('../models/OrderModel');
    // Fetch orders that are either "Pending Approval" OR have isRead: false
    // Sort by newest first
    const notifications = await OrderModel.find({
      $or: [
        { status: "Pending Approval" },
        { isRead: false }
      ]
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

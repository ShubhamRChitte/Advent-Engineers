const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { TransformerModel } = require('../models/TransformerModel');
const { CounterModel } = require('../models/CounterModel'); // Adjust path if needed
const { escapeRegExp } = require('../utils/regexHelper');
const path = require('path');


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
    const roleStageMap = {
      "core-tester": "core",
      "secondary-tester": "secondary",
      "after-primary-tester": "primary",
      "final-tester": "final",
      "pt-tester": "pt",
      "pt-pretester": "pt-pretest",
      "heating_operator": "heating"
    };

    const deptStageMap = {
      "Core Test": "core",
      "Secondary Test": "secondary",
      "Primary Test": "primary",
      "Final Test": "final",
      "PT Test": "pt",
      "PT Pretest": "pt-pretest",
      "Heating": "heating"
    };

    const userDepts = Array.isArray(user.departments) && user.departments.length > 0 
      ? user.departments 
      : (Array.isArray(user.department) ? user.department : [user.department].filter(Boolean));

    let stageKey = req.query.stage || roleStageMap[user.role] || deptStageMap[user.department];
    if (!stageKey && userDepts.length > 0) {
      for (const d of userDepts) {
        if (deptStageMap[d]) { stageKey = deptStageMap[d]; break; }
      }
    }
    console.log("ASSIGNEED ORDERS HIT: user=" + user.employeeId + ", role=" + user.role + ", depts=" + JSON.stringify(userDepts) + ", stageKey=" + stageKey);

    // Admin/Management Bypass
    const adminDepartments = ["Management", "Office", "Admin"];
    const isAdminUser = user.designation === "Admin" || userDepts.some(d => adminDepartments.includes(d));
    if (isAdminUser) {
      const query = req.query.stage ? { currentStage: req.query.stage } : { currentStage: "core" };
      if (req.query.type === 'active') {
        query.approved = { $ne: true };
      }
      const orders = await OrderModel.find(query).lean().sort({ updatedAt: -1 });
      console.log("ADMIN orders found: ", orders.length);
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
    const namesToCheck = [
      user.name,
      user.fullName,
      user.fullName && user.employeeId ? `${user.fullName} (${user.employeeId})` : null,
      user.fullName && user.employeeId ? `${user.fullName} (${user.employeeId.toLowerCase()})` : null,
      user.fullName && user.employeeId ? `${user.fullName} (${user.employeeId.toUpperCase()})` : null,
      (user.name || '').trim(),
      (user.fullName || '').trim()
    ].filter(Boolean);

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
    const assignedTransformers = await TransformerModel.find(activeAssignmentQuery).select('orderId uniqueId').lean();

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
        MeteringCoreTestModel.find(userTestQuery).select('orderId').lean(),
        ProtectionCoreTestModel.find(userTestQuery).select('orderId').lean()
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
      // User Request: Automatic Cleanup. 
      // Only show orders if the user has at least one PENDING transformer in the current stage.
      // This uses the activeOrderIds calculated above from TransformerModel.find({ currentStage: stageKey }).
      finalOrderQuery = { 
        _id: { $in: activeOrderIds },
        isApproved: true
      };
    } else if (filterType === 'history') {
      finalOrderQuery = {
        $or: [
          { _id: { $in: historyOrderIds } },
          { "assignments.core_tester": { $in: namesToCheck }, approved: true }, // Legacy Object check
          // Support for Array-based assignments (New Granular System)
          {
            assignments: {
              $elemMatch: {
                testerName: { $in: namesToCheck },
                stage: "core"
              }
            },
            approved: true
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
    console.log("TESTER Orders matched finalOrderQuery: ", orders.length);

    // 4. PRE-FETCH DATA TO AVOID N+1 QUERY PROBLEM
    const allOrderIds = orders.map(o => o._id);
    let allMeteringTests = [];
    let allProtectionTests = [];
    let allSecondaryTests = [];
    let allTransformers = [];

    if (stageKey === 'core') {
      const { MeteringCoreTestModel } = require('../models/MeteringCoreTestModel');
      const { ProtectionCoreTestModel } = require('../models/ProtectionCoreTestModel');

      [allMeteringTests, allProtectionTests] = await Promise.all([
        MeteringCoreTestModel.find({ orderId: { $in: allOrderIds } })
          .select('orderId testedBy coreType readings.internalCoreNo readings.date readings.result readings.remark readings.status readings.measuredMa readings.value')
          .lean(),
        ProtectionCoreTestModel.find({ orderId: { $in: allOrderIds } })
          .select('orderId testedBy coreType readings.internalCoreNo readings.date readings.result readings.remark readings.status readings.measuredMa readings.value')
          .lean()
      ]);
    } else if (stageKey === 'secondary') {
      const { SecondaryMeteringTestModel } = require('../models/SecondaryMeteringTestModel');
      const { TransformerModel } = require('../models/TransformerModel');

      allTransformers = await TransformerModel.find({ orderId: { $in: allOrderIds } }).select('orderId uniqueId').lean();
      const allTransformerIds = allTransformers.map(t => t.uniqueId);

      allSecondaryTests = await SecondaryMeteringTestModel.find({
        uniqueId: { $in: allTransformerIds }
      }).select('uniqueId coreId tester status testDate createdAt').lean();
    }

    // 5. Enrich Orders with "AssignedUnits" list and Pre-fetched Stats
    const currentUserName = (user.name || user.fullName || '').trim().toLowerCase();

    const enrichedOrders = orders.map((order) => {
      const oId = order._id.toString();
      const assignedUnitIds = orderToUnitMap[oId] || [];

      let stats = {
        testsCompleted: 0,
        passed: 0,
        failed: 0,
        userReadings: []
      };

      if (stageKey === 'core') {
        // Filter pre-fetched tests for this order
        const tests = [
          ...allMeteringTests.filter(t => t.orderId?.toString() === oId),
          ...allProtectionTests.filter(t => t.orderId?.toString() === oId)
        ];

        tests.filter(t => {
          if (!t || !t.testedBy) return false;
          return t.testedBy.trim().toLowerCase() === currentUserName;
        }).forEach(testDoc => {
          if (testDoc.readings) {
            testDoc.readings.forEach(r => {
              if (r.internalCoreNo) {
                stats.testsCompleted++;
                const rawOutcome = (r.result || r.remark || r.status || '').toUpperCase();
                let outcome = rawOutcome;

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
        const orderTransformers = allTransformers.filter(t => t.orderId?.toString() === oId);
        const transformerIds = orderTransformers.map(t => t.uniqueId);

        if (transformerIds.length > 0) {
          const secondaryTests = allSecondaryTests.filter(t => transformerIds.includes(t.uniqueId));

          secondaryTests.filter(t => {
            if (!t || !t.tester) return false;
            return t.tester.trim().toLowerCase() === currentUserName;
          }).forEach(testDoc => {
            stats.testsCompleted++;
            const status = (testDoc.status || 'Completed').toUpperCase();

            if (status === 'COMPLETED' || status === 'PASS') {
              stats.passed++;
            } else if (status === 'FAIL') {
              stats.failed++;
            }

            stats.userReadings.push({
              coreId: `${testDoc.uniqueId} - ${testDoc.coreId}`,
              date: testDoc.testDate || testDoc.createdAt,
              result: status,
              type: 'Secondary Metering'
            });
          });
        }
      }

      return { ...order, userStats: stats, assignedUnitIds: assignedUnitIds };
    });

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
    const { OrderModel } = require('../models/OrderModel');

    let orderId = req.params.orderId;

    // Attempt to interpret orderId. It could be an _id or a jobId (string).
    // Use OrderModel to resolve the correct _id if possible.
    // If it looks like an ObjectId, check if an Order exists with that _id.
    const mongoose = require('mongoose');
    let order;

    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await OrderModel.findById(orderId);
    }

    if (!order) {
      // Try finding by jobId or orderId string field
      order = await OrderModel.findOne({ $or: [{ jobId: orderId }, { orderId: orderId }] });
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Now fetch transformers using the resolved Order _id
    // AND also try the string version just in case of inconsistent data
    const transformers = await TransformerModel.find({
      $or: [
        { orderId: order._id },
        { orderId: order._id.toString() },
        { jobId: order.jobId } // covering bases: match string jobId against string field
      ]
    });

    res.json(transformers);
  } catch (err) {
    console.error("Error fetching transformers:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ FETCH SINGLE TRANSFORMER
router.get('/transformers/:uniqueId', isAuthenticated, async (req, res) => {
  try {
    const { TransformerModel } = require('../models/TransformerModel');
    // Find by uniqueId (string ID)
    const transformer = await TransformerModel.findOne({ uniqueId: req.params.uniqueId }).populate('orderId');
    if (!transformer) return res.status(404).json({ message: "Transformer not found" });

    const obj = transformer.toObject();
    if (obj.orderId) {
      obj.jobId = obj.orderId.jobId;
      obj.clientName = obj.orderId.clientName;
      obj.accuracyClass = obj.orderId.accuracyClass;
    }

    res.json(obj);
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
    const nameRegexes = namesToCheck.map(n => new RegExp(escapeRegExp(n), 'i'));

    console.log("Fetching secondary reports for names:", namesToCheck);

    const isAdmin = user.role === 'admin' || user.designation === 'Admin' || ['Management', 'Office', 'Admin'].includes(user.department);
    const query = {
      // User Request: Show ONLY "Completed" reports (approved by tester).
      // STRICTLY match the 'tester' field (no assignment fallback) to ensure they only see what THEY tested.
      // Excludes "In Progress" and "Pending".
      "testHistory.secondary_test.status": "Completed"
    };

    if (!isAdmin) {
      query.$or = [
        ...nameRegexes.map(r => ({ "testHistory.secondary_test.tester": { $regex: r } }))
      ];
    }

    const transformers = await TransformerModel.find(query).sort({ updatedAt: -1 }).limit(200).populate('orderId');

    const enrichedTransformers = transformers.map(t => {
      const obj = t.toObject();
      if (obj.orderId) {
        obj.jobId = obj.orderId.jobId;
        obj.clientName = obj.orderId.clientName;
        // Also attach accuracyClass and ratio if needed later
        obj.accuracyClass = obj.orderId.accuracyClass;
      }
      return obj;
    });

    const fs = require('fs');
    const logPath = path.join(__dirname, '../debug_api_log.txt');
    fs.appendFileSync(logPath,
      `\n[${new Date().toISOString()}] User: '${currentUserName}' | Found: ${transformers.length} reports | Query: ${JSON.stringify(query)}`
    );

    console.log(`Found ${transformers.length} completed reports for ${currentUserName}`);
    res.json(enrichedTransformers);
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
    const nameRegexes = namesToCheck.map(n => new RegExp(escapeRegExp(n), 'i'));

    const isAdmin = user.role === 'admin' || user.designation === 'Admin' || ['Management', 'Office', 'Admin'].includes(user.department);
    const query = {
      // User Request: Show ONLY "Completed" reports (approved by tester).
      "testHistory.primary_test.status": "Completed"
    };

    if (!isAdmin) {
      query.$or = [
        ...nameRegexes.map(r => ({ "testHistory.primary_test.tester": { $regex: r } }))
      ];
    }

    const transformers = await TransformerModel.find(query).sort({ updatedAt: -1 }).limit(200).populate('orderId');

    const enrichedTransformers = transformers.map(t => {
      const obj = t.toObject();
      if (obj.orderId) {
        obj.jobId = obj.orderId.jobId;
        obj.clientName = obj.orderId.clientName;
        obj.accuracyClass = obj.orderId.accuracyClass;
      }
      return obj;
    });

    console.log(`Found ${transformers.length} completed after-primary reports for ${currentUserName}`);
    res.json(enrichedTransformers);
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
    const nameRegexes = namesToCheck.map(n => new RegExp(escapeRegExp(n), 'i'));

    const isAdmin = user.role === 'admin' || user.designation === 'Admin' || ['Management', 'Office', 'Admin'].includes(user.department);
    const query = {
      // User Request: Show ONLY "Completed" reports (approved by tester).
      "testHistory.final_test.status": "Completed"
    };

    if (!isAdmin) {
      query.$or = [
        ...nameRegexes.map(r => ({ "testHistory.final_test.tester": { $regex: r } }))
      ];
    }

    const transformers = await TransformerModel.find(query).sort({ updatedAt: -1 }).limit(200).populate('orderId');

    const enrichedTransformers = transformers.map(t => {
      const obj = t.toObject();
      if (obj.orderId) {
        obj.jobId = obj.orderId.jobId;
        obj.clientName = obj.orderId.clientName;
        obj.accuracyClass = obj.orderId.accuracyClass;
      }
      return obj;
    });

    console.log(`Found ${transformers.length} completed final reports for ${currentUserName}`);
    res.json(enrichedTransformers);
  } catch (err) {
    console.error("Error fetching final reports:", err);
    res.status(500).json({ error: err.message });
  }
});




// ✅ FETCH ALL ORDERS (ADMIN VIEW) WITH PAGINATION AND COUNTS
router.get('/admin/orders', isAuthenticated, async (req, res) => {
  try {
    const { OrderModel } = require('../models/OrderModel');
    
    // Extract query parameters
    const limit = parseInt(req.query.limit) || 0; // 0 means no limit (fallback)
    const skip = parseInt(req.query.skip) || 0;
    const search = req.query.search || '';
    const statusFilter = req.query.status || 'all';
    const typeFilter = req.query.type || 'all';

    // Build the query
    let query = {};

    if (typeFilter !== 'all') {
      query.transformerType = new RegExp(`^${escapeRegExp(typeFilter)}$`, 'i');
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegExp(search), 'i');
      query.$or = [
        { jobId: searchRegex },
        { orderId: searchRegex },
        { clientName: searchRegex },
        { transformerName: searchRegex }
      ];
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'Pending') {
        query.status = 'Pending Approval';
      } else if (statusFilter === 'Completed') {
        query.status = { $in: ['COMPLETED', 'Completed', 'PT Testing Completed', 'Final Testing Completed'] };
      } else if (statusFilter === 'In Testing') {
        // Exclude Pending and Completed
        query.status = { $nin: ['Pending Approval', 'COMPLETED', 'Completed', 'PT Testing Completed', 'Final Testing Completed'] };
      } else {
        query.status = statusFilter;
      }
    }

    // Determine if we are doing a paginated request or the old bulk request
    // The new frontend will send ?paginated=true
    if (req.query.paginated === 'true') {
      // 1. Get Paginated Orders
      const orders = await OrderModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // 2. Get Global Counts (irrespective of search, so tabs show accurate totals)
      const [allCount, pendingCount, inTestingCount, completedCount, assignedCount] = await Promise.all([
        OrderModel.countDocuments({}),
        OrderModel.countDocuments({ status: 'Pending Approval' }),
        OrderModel.countDocuments({ status: { $nin: ['Pending Approval', 'COMPLETED', 'Completed', 'PT Testing Completed', 'Final Testing Completed'] } }),
        OrderModel.countDocuments({ status: { $in: ['COMPLETED', 'Completed', 'PT Testing Completed', 'Final Testing Completed'] } }),
        OrderModel.countDocuments({ status: { $in: ['Assigned', 'In Progress'] } })
      ]);

      const counts = {
        all: allCount,
        Pending: pendingCount,
        Assigned: assignedCount,
        'In Testing': inTestingCount,
        Completed: completedCount
      };

      res.json({ success: true, orders, counts });
    } else {
      // Fallback for legacy components (e.g. OrdersListView.tsx if it's not updated yet)
      const orders = await OrderModel.find({}).lean().sort({ createdAt: -1 }).limit(1000);
      res.json(orders);
    }

  } catch (err) {
    console.error("Admin orders error:", err);
    res.status(500).json({ error: err.message });
  }
});

// (ADmin Notifications moved to notificationRoutes.js)


// --- NEW ENDPOINT: Client Stats for Reports ---
router.get('/orders/clients/stats', async (req, res) => {
  try {
    const { OrderModel } = require('../models/OrderModel');
    const stats = await OrderModel.aggregate([
      {
        $group: {
          _id: "$clientName", // Group by Client Name (Correct field: clientName, not companyName)
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
          },
          inProgressOrders: {
            $sum: { $cond: [{ $ne: ["$status", "Completed"] }, 1, 0] }
          },
          // Optional: Get contact info from the latest order for this client
          // We can try to find fields like clientContactNo or emailId if they exist in schema
          contactNumber: { $first: "$clientContactNo" },
          email: { $first: "$emailId" }
        }
      },
      { $sort: { _id: 1 } } // Sort alphabetically by client name
    ]);

    // Map to frontend structure
    const clients = stats.map((client, index) => ({
      id: client._id || `client-${index}`,
      name: client._id || 'Unknown Client',
      contactNumber: client.contactNumber || 'N/A',
      email: client.email || 'N/A',
      totalOrders: client.totalOrders,
      completedOrders: client.completedOrders,
      inProgressOrders: client.inProgressOrders
    }));

    res.status(200).json({ success: true, clients });
  } catch (error) {
    console.error("Error fetching client stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- NEW ENDPOINT: Orders by Client Name ---
router.get('/orders/client/:clientName', async (req, res) => {
  try {
    const { OrderModel } = require('../models/OrderModel');
    const clientName = req.params.clientName;
    // Use regex for case-insensitive matching if needed, or exact match
    const orders = await OrderModel.find({ clientName: clientName }).lean().sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching client orders:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- NEW ENDPOINT: Aggregated Reports for Order ---
router.get('/orders/:orderId/reports-aggregation', async (req, res) => {
  try {
    const { TransformerModel } = require('../models/TransformerModel');
    const { OrderModel } = require('../models/OrderModel');
    const orderId = req.params.orderId;

    const order = await OrderModel.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const transformers = await TransformerModel.find({ orderId: orderId });
    const totalUnits = transformers.length;

    const stages = [
      { key: 'core_test', label: 'Core Testing', prefix: 'CT' },
      { key: 'secondary_test', label: 'Secondary Testing', prefix: 'ST' },
      { key: 'primary_test', label: 'After Primary Testing', prefix: 'APT' }, // Mapping 'primary_test' to 'After Primary Testing' label as per UI
      { key: 'final_test', label: 'Final Testing', prefix: 'FT' }
    ];

    const reports = [];

    stages.forEach(stage => {
      const stageKey = stage.key;
      // Filter transformers that have activity in this stage
      // We check if status is 'Completed'
      const completedUnits = transformers.filter(t =>
        t.testHistory && t.testHistory[stageKey] && t.testHistory[stageKey].status === 'Completed'
      );

      // If we have at least one completed unit, generate a report entry
      // Or maybe strictly if ALL are completed? 
      // The UI shows "Units Tested: 25 units" (matching total).
      // Let's generate it if > 0.
      if (completedUnits.length > 0) {
        // Get latest date
        const timestamps = completedUnits
          .map(t => t.testHistory[stageKey].timestamp ? new Date(t.testHistory[stageKey].timestamp) : null)
          .filter(d => d !== null);

        const latestDate = timestamps.length > 0
          ? new Date(Math.max(...timestamps)).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        // Get distinct testers
        const testers = [...new Set(completedUnits.map(t => t.testHistory[stageKey].tester).filter(Boolean))];

        // Check for failures (if any unit failed? But status 'Completed' usually means done. 
        // We don't have explicit pass/fail in TransformerSchema status, only 'Pending'/'Completed'.
        // We assume Completed = Pass for the workflow process here, unless we dig into readings.
        // Let's assume PASS for now if Completed.)
        const result = 'PASS';

        reports.push({
          id: `${stage.prefix}-${order.jobId}`, // unique ID for frontend key
          testType: stage.label,
          reportNumber: `${stage.prefix}-${order.jobId}`,
          testDate: latestDate,
          testedBy: testers.join(', ') || 'Various',
          result: result,
          transformersTest: completedUnits.length,
          remarks: `Completed testing for ${completedUnits.length} / ${totalUnits} units.`,
          testDetails: [
            { label: 'Total Units', value: totalUnits.toString() },
            { label: 'Tested Units', value: completedUnits.length.toString() },
            { label: 'Pending Units', value: (totalUnits - completedUnits.length).toString() },
            { label: 'Status', value: completedUnits.length === totalUnits ? 'Completed' : 'Partial' }
          ]
        });
      }
    });

    res.status(200).json({ success: true, reports });

  } catch (error) {
    console.error("Error aggregating reports:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

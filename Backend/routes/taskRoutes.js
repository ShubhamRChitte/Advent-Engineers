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

    // Map departments to stages
    const stageMap = {
      "Core Test": "core",
      "Secondary Test": "secondary",
      "Primary Test": "primary",
      "Final Test": "final"
    };

    let stageKey = stageMap[user.department];
    let query = {};

    // Handle Admin/Management/Office roles - Give them visibility of everything or default to core
    const adminDepartments = ["Management", "Office", "Admin"];
    if (adminDepartments.includes(user.department) || user.designation === "Admin") {
      // Admin can see everything, or filter by query param if provided
      // For now, let's default to showing all active orders or core orders based on frontend need.
      // The frontend seems to expect a specific list. 
      // If we want them to use the "Tracking Core" page, we should return orders at 'core' stage.

      stageKey = "core"; // Default to core for checking

      // OPTIONAL: If frontend supports query param ?stage=secondary, use that.
      if (req.query.stage) stageKey = req.query.stage;

      // Admins see ALL orders in that stage, not restricted by assignment
      query = { currentStage: stageKey };

    } else {
      // Regular Tester Logic
      if (!stageKey) {
        return res.status(400).json({ message: "Invalid Department for testing" });
      }

      // Filter by currentStage and assignment
      const assignmentField = `assignments.${stageKey}_tester`;

      query = {
        currentStage: stageKey,
        [assignmentField]: user.fullName
      };
    }

    const orders = await OrderModel.find(query);
    res.json(orders);
  } catch (err) {
    console.error("Error in /assigned_orders:", err);
    res.status(500).json({ error: err.message });
  }
});

// Backend Route: PUT /api/core-tests/approve/:orderId
// This route is called when the user clicks "Approve & Send to Secondary"
// It moves the order out of the "Core" stage.
router.put('/core-tests/approve/:orderId', async (req, res) => {
  try {
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      req.params.orderId,
      {
        $set: {
          currentStage: "secondary", // This makes it vanish from Core dashboard
          status: "Core Testing Completed",
          "completionStages.core": true
        }
      },
      { new: true }
    );
    res.status(200).json({ success: true, data: updatedOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

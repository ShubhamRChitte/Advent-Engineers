// routes/coreTestRoutes.js
const express = require('express');
const router = express.Router();
const { OrderModel } = require('../models/OrderModel');

const { isAuthenticated } = require('../middlewares/authMiddleware');

// PUT /api/core-tests/approve/:orderId
// Granular Approval: Updates only the transformers assigned to the current user
router.put('/approve/:orderId', isAuthenticated, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { TransformerModel } = require('../models/TransformerModel');

        // 1. Identify User and Stage
        const user = req.user;
        const testerName = user.name || user.fullName; // Fallback handled

        // 2. BULK UPDATE
        // Update transformers for this order, in 'core' stage, AND assigned to this user
        const updateQuery = {
            orderId: orderId,
            currentStage: 'core',
            "assignments.core_tester": testerName // Strict User Check
        };

        const updateResult = await TransformerModel.updateMany(
            updateQuery,
            {
                $set: { currentStage: 'secondary' }
            }
        );

        // Check if ANY transformers are left in 'core' for this order.
        const remainingCoreUnits = await TransformerModel.countDocuments({
            orderId: orderId,
            currentStage: 'core'
        });

        // Update Order Status only if ALL units are done (Optional, but good for tracking)
        // OR better: Update Order status to "Partial" or keep "In Progress".
        // If remaining == 0, then we can mark Order as Core Testing Completed.
        let orderUpdate = null;
        if (remainingCoreUnits === 0) {
            orderUpdate = await OrderModel.findByIdAndUpdate(
                orderId,
                {
                    $set: {
                        currentStage: "secondary",
                        status: "Core Testing Completed",
                        "completionStages.core": true
                    }
                },
                { new: true }
            );
        }

        res.status(200).json({
            success: true,
            message: `Approved ${updateResult.modifiedCount} units.`,
            orderUpdated: !!orderUpdate,
            data: orderUpdate
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

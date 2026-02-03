// routes/coreTestRoutes.js
const express = require('express');
const router = express.Router();
const { OrderModel } = require('../models/OrderModel');

// PUT /api/core-tests/approve/:orderId
router.put('/approve/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        const updatedOrder = await OrderModel.findByIdAndUpdate(
            orderId,
            {
                $set: {
                    currentStage: "secondary", // Moves order to Secondary Dashboard
                    status: "Core Testing Completed",
                    "completionStages.core": true
                }
            },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ success: true, data: updatedOrder });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

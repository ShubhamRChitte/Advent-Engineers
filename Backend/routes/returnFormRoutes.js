const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ReturnFormModel } = require('../models/ReturnFormModel');
const { FailedCoreModel } = require('../models/FailedCoreModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// POST /api/return-forms
// Create a new return form and update failed core statuses
router.post('/', isAuthenticated, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { vendorName, vendorId, returnDate, cores, remarks } = req.body;

        // 1. Generate unique return number
        const count = await ReturnFormModel.countDocuments();
        const returnNumber = `RF-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        // 2. Create Return Form
        const returnForm = new ReturnFormModel({
            returnNumber,
            vendorName,
            vendorId: vendorId || null,
            returnDate: returnDate || new Date(),
            cores,
            remarks,
            createdBy: req.user.name || "System"
        });

        await returnForm.save({ session });

        // 3. Update all linked FailedCores
        const coreIds = cores.map(c => c.failedCoreId);
        await FailedCoreModel.updateMany(
            { _id: { $in: coreIds } },
            {
                $set: {
                    status: 'RETURNED',
                    returnStatus: 'RETURNED',
                    returnedDate: returnDate || new Date(),
                    returnFormId: returnForm._id,
                    returnedBy: req.user.name || "System"
                }
            },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "Return form generated and cores updated",
            data: returnForm
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Return Form Logic Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// GET /api/return-forms
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const data = await ReturnFormModel.find().sort({ createdAt: -1 });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

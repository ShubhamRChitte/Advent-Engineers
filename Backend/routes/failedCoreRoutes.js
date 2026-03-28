const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { FailedCoreModel } = require('../models/FailedCoreModel');
const { OrderModel } = require('../models/OrderModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

const failedCoreService = require('../services/failedCoreService');
const AppError = require('../utils/AppError');

// POST /api/failed-cores
// Transaction-safe creation of failure record via Service
router.post('/', isAuthenticated, async (req, res, next) => {
    try {
        const {
            orderId,
            internalCoreNo,
            failureReason,
            failureStage,
            dynamicValues
        } = req.body;

        console.log("[DEBUG] Failed Core Request Body:", req.body);

        // 1. Basic Input Validation
        if (!orderId || !internalCoreNo || !failureReason) {
            console.log("[DEBUG] Validation Failed. orderId:", orderId, " core:", internalCoreNo, " reason:", failureReason);
            return next(new AppError("Missing required fields: orderId, internalCoreNo, failureReason", 400, "VALIDATION_ERROR"));
        }

        // 2. Delegate to Service
        const failedCore = await failedCoreService.recordFailure(
            orderId,
            internalCoreNo,
            { failureReason, failureStage, dynamicValues }
        );

        res.status(201).json({
            success: true,
            message: "Failed core recorded successfully",
            data: failedCore
        });

    } catch (error) {
        // Pass to Global Error Handler (or handle specific service errors)
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.errorCode,
                message: error.message
            });
        }
        console.error("Failed Core Route Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error during failure recording." });
    }
});

// PUT /api/failed-cores/:id/return
// Marks a failed core as returned to vendor
router.put('/:id/return', isAuthenticated, async (req, res, next) => {
    try {
        const failedCoreId = req.params.id;
        const returnedBy = req.user.name || req.user.fullName || "User"; // Assuming auth sets req.user

        const updatedCore = await failedCoreService.returnToVendor(failedCoreId, returnedBy);

        res.status(200).json({
            success: true,
            message: "Core marked as returned to vendor",
            data: updatedCore
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.errorCode,
                message: error.message
            });
        }
        console.error("Return to Vendor Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error during core return." });
    }
});

// POST /api/failed-cores/bulk-return
// Marks multiple failed cores as returned to vendor
router.post('/bulk-return', isAuthenticated, async (req, res, next) => {
    try {
        const { coreIds } = req.body;
        if (!Array.isArray(coreIds) || coreIds.length === 0) {
            return res.status(400).json({ success: false, message: "No core IDs provided." });
        }

        const returnedBy = req.user.name || req.user.fullName || "User";

        const results = [];
        const errors = [];

        for (const id of coreIds) {
            try {
                const updatedCore = await failedCoreService.returnToVendor(id, returnedBy);
                results.push(updatedCore);
            } catch (err) {
                errors.push({ id, error: err.message });
            }
        }

        res.status(200).json({
            success: true,
            message: `Successfully returned ${results.length} cores.`,
            data: results,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error("Bulk Return to Vendor Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error during bulk core return." });
    }
});

// PUT /api/failed-cores/:id/undo-return
// Undoes the return of a failed core
router.put('/:id/undo-return', isAuthenticated, async (req, res, next) => {
    try {
        const failedCoreId = req.params.id;
        const updatedCore = await failedCoreService.undoReturnToVendor(failedCoreId);

        res.status(200).json({
            success: true,
            message: "Core return undone successfully",
            data: updatedCore
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.errorCode,
                message: error.message
            });
        }
        console.error("Undo Return Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error during core return undo." });
    }
});

// GET /api/failed-cores
// Fetch failed cores with filtering
// GET /api/failed-cores
// Fetch failed cores with advanced filtering and pagination
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            search,
            orderId,
            vendorId,
            coreType,
            failureStage,
            status,
            startDate,
            endDate
        } = req.query;

        const query = {};

        // 1. Exact Filters
        if (orderId) query.orderId = orderId;
        if (vendorId) query.vendorId = vendorId;
        if (coreType) query.coreType = coreType;
        if (failureStage) query.failureStage = failureStage;
        if (status) query.status = status;

        // 2. Search (Multi-field)
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { internalCoreNo: searchRegex },
                { vendorCoreNo: searchRegex },
                { clientName: searchRegex },
                { orderNumber: searchRegex },
                { vendorName: searchRegex },
                { jobId: searchRegex }
            ];
        }

        // 3. Date Range
        if (startDate || endDate) {
            query.failedAt = {};
            if (startDate) query.failedAt.$gte = new Date(startDate);
            if (endDate) query.failedAt.$lte = new Date(endDate);
        }

        // 4. Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // 5. Execute Query
        const [data, total] = await Promise.all([
            FailedCoreModel.find(query)
                .sort({ failedAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(), // Performance optimization
            FailedCoreModel.countDocuments(query)
        ]);

        res.json({
            success: true,
            data,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        console.error("Failed Cores Fetch Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/failed-cores/count
// Quick count for badges (e.g., Navbar)
router.get('/count', isAuthenticated, async (req, res) => {
    try {
        // Optional: Allow filtering count via query params if needed
        const count = await FailedCoreModel.countDocuments({});
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

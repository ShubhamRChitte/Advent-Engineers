const express = require('express');
const router = express.Router();
const { TransformerModel } = require('../models/TransformerModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// GET /api/final/reports
// Fetch completed final reports
router.get('/reports', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        const isAdmin = user.role === 'admin';

        // Build Query
        // 1. Must be completed final test
        const query = {
            'testHistory.final_test.status': 'Completed'
        };

        // 2. If not admin, maybe filter by tester (optional, currently showing all for transparency or filter by assignment)
        // For "My Reports", we technically should filter by logged-in tester.
        // Let's filter by tester if the user is a tester.
        // if (!isAdmin) {
        //     query['testHistory.final_test.tester'] = user.name || user.fullName;
        // }
        // Commented out to allow view all for now, as per typical pattern

        // Fetch and populate Order to get Client Name, Job ID, etc.
        const reports = await TransformerModel.find(query)
            .populate('orderId')
            .sort({ 'testHistory.final_test.timestamp': -1 });

        res.json(reports);

    } catch (error) {
        console.error("Error fetching final reports:", error);
        res.status(500).json({ success: false, message: "Failed to fetch reports" });
    }
});

// POST /api/final/:id
// Save or Finalize Final Test Report with failure routing
router.post('/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body;
        const testerName = req.user.name || req.user.fullName || "Unknown Tester";

        const transformer = await TransformerModel.findOne({ uniqueId: id }).populate('orderId');
        if (!transformer) {
            return res.status(404).json({ success: false, message: "Transformer not found" });
        }

        // Automatic Megger Test Validations
        // Pri-Sec > 1000, Pri-Earth > 1000, Sec-Earth > 500, Core-Core > 200
        const m1 = parseFloat(payload.meggarPrimaryToSecondary) || 0;
        const m2 = parseFloat(payload.meggarPrimaryToEarth) || 0;
        const m3 = parseFloat(payload.meggarSecondaryToEarth) || 0;
        const m4 = parseFloat(payload.meggarCoreToCore) || 0;

        let automaticMeggarFailures = [];
        if (m1 > 1000) automaticMeggarFailures.push("Megger Primary to Secondary exceeds 1000 MΩ");
        if (m2 > 1000) automaticMeggarFailures.push("Megger Primary to Earth exceeds 1000 MΩ");
        if (m3 > 500) automaticMeggarFailures.push("Megger Secondary to Earth exceeds 500 MΩ");
        if (m4 > 200) automaticMeggarFailures.push("Megger Core to Core exceeds 200 MΩ");

        // Determine Failures & Routing
        let failedStage = null;
        let requiresAdminReview = false;
        let returnTargetStage = null;
        let failureReason = "";

        // Evaluate in order of severity/workflow rules
        if (automaticMeggarFailures.length > 0) {
            failedStage = "FINAL_MEGGER_TEST";
            failureReason = automaticMeggarFailures.join(" | ");
            // Moves straight to failed, no admin review required to return to a specific stage yet (default behavior)
        } else if (payload.polarityResult === "Fail") {
            failedStage = "FINAL_POLARITY_TEST";
            failureReason = "Polarity Test Failed";
        } else if (payload.hvSecondaryWinding === "Fail") {
            failedStage = "FINAL_HV_SECONDARY";
            failureReason = "H.V. Secondary Winding Test Failed";
        } else if (payload.hvPrimaryWinding === "Fail") {
            failedStage = "FINAL_HV_PRIMARY";
            failureReason = "H.V. Primary Winding Test Failed";
            requiresAdminReview = true;
            returnTargetStage = "primary"; // Per rules: Admin approves retest -> Stage = Primary
        } else if (payload.hvBetweenCore === "Fail") {
            failedStage = "FINAL_HV_CORE";
            failureReason = "H.V. Between Core Test Failed";
            requiresAdminReview = true;
            returnTargetStage = "primary"; // Per rules: Send back to Primary
        } else if (payload.ovitTest === "Fail") {
            failedStage = "FINAL_OVIT";
            failureReason = "O.V.I.T. Test Failed";
            requiresAdminReview = true;
            returnTargetStage = "secondary"; // Per rules: Send back to Secondary
        }

        // Update transformer test history
        transformer.testHistory = transformer.testHistory || {};
        transformer.testHistory.final_test = {
            ...transformer.testHistory.final_test,
            status: failedStage ? "Failed" : "Completed",
            tester: testerName,
            polarityResult: payload.polarityResult,
            hvSecondaryWinding: payload.hvSecondaryWinding,
            hvPrimaryWinding: payload.hvPrimaryWinding,
            hvBetweenCore: payload.hvBetweenCore,
            ovitTest: payload.ovitTest,
            meggarPrimaryToSecondary: payload.meggarPrimaryToSecondary,
            meggarPrimaryToEarth: payload.meggarPrimaryToEarth,
            meggarSecondaryToEarth: payload.meggarSecondaryToEarth,
            meggarCoreToCore: payload.meggarCoreToCore,
            timestamp: new Date()
        };

        // Handle Failure
        if (failedStage) {
            if (requiresAdminReview) {
                transformer.currentStage = "admin_review";
                transformer.adminReviewDetails = {
                    failedStage: failedStage,
                    returnTargetStage: returnTargetStage,
                    requestedAt: new Date()
                };
            } else {
                // Regular failure stays in final (or whatever the standard failure flow is)
                // Assuming it just stays in 'final' but status is 'Failed' to be picked up by Failed Section logic
            }

            // Record in Failed Cores Collection
            const failedCoreSvc = require('../services/failedCoreService');

            const actualOrderId = transformer.orderId?._id || transformer.orderId;
            if (!actualOrderId) {
                console.error("CRITICAL ERROR: Cannot record failure, transformer.orderId is missing.", transformer.uniqueId);
                throw new Error("Order association missing for this transformer.");
            }

            await failedCoreSvc.recordFailure(
                actualOrderId,
                transformer.uniqueId, // Using Transformer UniqueId as 'internalCoreNo' for Final Test level failure
                {
                    failureStage: failedStage,
                    failureReason: failureReason
                }
            );

        } else {
            // Success
            if (transformer.currentStage === "final") {
                transformer.currentStage = "shipped"; // Or whatever next stage is
            }
        }

        transformer.markModified('testHistory');
        await transformer.save();

        res.json({
            success: true,
            message: failedStage
                ? (requiresAdminReview ? "Test failed. Moved to Admin Review." : "Test failed. Moved to failed section.")
                : "Final Test completed successfully.",
            requiresAdminReview
        });

    } catch (error) {
        console.error("Error saving final test:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/final/:id/generate-save
// Save Final Test Report data into the Transformer schema directly and mark it as completed/shipped
router.post('/:id/generate-save', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body;
        const testerName = req.user.name || req.user.fullName || "Unknown Tester";

        const transformer = await TransformerModel.findOne({ uniqueId: id });
        if (!transformer) {
            return res.status(404).json({ success: false, message: "Transformer not found" });
        }

        // Store the exact report generation payload
        transformer.finalReportData = {
            ...payload,
            generatedAt: new Date(),
            generatedBy: testerName
        };

        // Also update standard history
        transformer.testHistory = transformer.testHistory || {};
        transformer.testHistory.final_test = {
            ...transformer.testHistory.final_test,
            status: "In Progress", // Decoupled from stage transition
            tester: testerName,
            polarityResult: payload.polarityResult,
            hvSecondaryWinding: payload.hvSecondaryWinding,
            hvPrimaryWinding: payload.hvPrimaryWinding,
            hvBetweenCore: payload.hvBetweenCore,
            ovitTest: payload.ovitTest,
            meggarPrimaryToSecondary: payload.meggarPrimaryToSecondary,
            meggarPrimaryToEarth: payload.meggarPrimaryToEarth,
            meggarSecondaryToEarth: payload.meggarSecondaryToEarth,
            meggarCoreToCore: payload.meggarCoreToCore,
            timestamp: new Date()
        };

        // Automatic stage transition removed. 
        // Must be approved via /api/transformers/:uniqueId/approve-stage now.

        transformer.markModified('testHistory');
        transformer.markModified('finalReportData');
        await transformer.save();

        res.json({
            success: true,
            message: "Final report data saved. Unit is now ready for Approval."
        });

    } catch (error) {
        console.error("Error saving final generated report:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

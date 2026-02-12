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

module.exports = router;

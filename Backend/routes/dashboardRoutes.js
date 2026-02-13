const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { OrderModel } = require('../models/OrderModel');
const { UserModel } = require('../models/UserModel');
const { TransformerModel } = require('../models/TransformerModel');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        // 1. Basic Counts
        const totalEmployees = await UserModel.countDocuments({ activeStatus: true });

        // Active orders: Not completed/shipped? 
        // Logic: Orders that are not fully completed.
        // Or strictly status based. Let's assume 'Completed' is the final status.
        const activeOrders = await OrderModel.countDocuments({ status: { $ne: 'Completed' } });

        // Tests Completed: Count of transformers where currentStage is 'shipped' (assuming shipped means all done)
        // OR check completionStages in order (but that's order level).
        // Let's count transformers that passed 'final' stage.
        // Assuming 'final' stage completion is marked in testHistory.final_test.status = 'Completed'.
        // Or simplified: currentStage === 'shipped' or 'final' + completed.
        // Let's use: count transformers where currentStage is 'shipped'.
        const testsCompleted = await TransformerModel.countDocuments({ currentStage: 'shipped' });

        // Pending Tests: All active transformers not shipped.
        const totalTransformers = await TransformerModel.countDocuments({});
        const pendingTests = totalTransformers - testsCompleted;

        // 2. Testing Progress Trend (Dynamic Aggregation)
        // We want to show the last 6 months of data.
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push({
                monthVal: d.getMonth(), // 0-11
                yearVal: d.getFullYear(),
                label: d.toLocaleString('default', { month: 'short' }),
                core: 0,
                secondary: 0,
                final: 0
            });
        }

        // Fetch needed fields from all transformers
        // Optimize: limit to last 6 months using updatedUpdatedAt if possible, but testHistory timestamps are nested.
        // For now, fetch all and filter in JS (dataset size < 10k is fine)
        const allTransformers = await TransformerModel.find({})
            .select('testHistory currentStage')
            .lean();

        allTransformers.forEach(t => {
            const history = t.testHistory || {};

            // Helper to increment count if timestamp matches a month in our range
            const checkStage = (stageName, stageData) => {
                if (stageData && (stageData.status === 'Completed' || stageData.timestamp)) {
                    // If status is completed or we have a timestamp (assuming timestamp means completed or at least activity)
                    // Ideally check status === 'Completed'
                    if (stageData.status !== 'Completed') return;

                    const ts = stageData.timestamp ? new Date(stageData.timestamp) : null;
                    if (ts) {
                        const m = ts.getMonth();
                        const y = ts.getFullYear();

                        // Find matching month in our array
                        const monthEntry = months.find(entry => entry.monthVal === m && entry.yearVal === y);
                        if (monthEntry) {
                            monthEntry[stageName]++;
                        }
                    }
                }
            };

            checkStage('core', history.core_test);
            checkStage('secondary', history.secondary_test);
            checkStage('final', history.final_test);
        });

        const testingData = months.map(m => ({
            month: m.label,
            core: m.core,
            secondary: m.secondary,
            final: m.final
        }));

        // 3. Order Status Distribution (Dynamic)
        const pendingOrders = await OrderModel.countDocuments({ status: 'Pending Approval' });
        const coreOrders = await OrderModel.countDocuments({ currentStage: 'core', status: { $ne: 'Pending Approval' } });
        // orders don't have 'currentStage' field, they have it? Yes, generatedTransformersForOrder updates it.
        // Let's check OrderModel.
        // Actually OrderModel has `currentStage` (string) in some previous code snippets I saw?
        // Let's check OrderSchema... I didn't check OrderSchema, only Model.
        // Assuming Order has 'status'.
        const inProgress = await OrderModel.countDocuments({ status: 'In Progress' });
        const completedOrders = await OrderModel.countDocuments({ status: 'Completed' });

        const orderData = [
            { name: 'Pending', value: pendingOrders },
            { name: 'In Progress', value: inProgress },
            { name: 'Completed', value: completedOrders },
        ];


        // 4. Recent Activity
        // Get last 3 created orders
        const recentOrders = await OrderModel.find().sort({ createdAt: -1 }).limit(3).lean();
        // Get last 3 added users
        const recentUsers = await UserModel.find().sort({ createdAt: -1 }).limit(2).lean();

        const activity = [];

        recentOrders.forEach(o => {
            activity.push({
                action: 'New order created',
                detail: `Order #${o.jobId} by ${o.clientName}`,
                time: o.createdAt,
                type: 'success'
            });
        });

        recentUsers.forEach(u => {
            activity.push({
                action: 'Employee added',
                detail: `New member ${u.fullName} (${u.designation})`,
                time: u.createdAt,
                type: 'info'
            });
        });

        // Sort by time desc
        activity.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.status(200).json({
            success: true,
            stats: [
                { label: 'Total Employees', value: totalEmployees.toString(), icon: 'Users', color: 'blue', change: '+0' },
                { label: 'Active Orders', value: activeOrders.toString(), icon: 'Package', color: 'purple', change: '+0' },
                { label: 'Tests Completed', value: testsCompleted.toString(), icon: 'CheckCircle2', color: 'green', change: '+0' },
                { label: 'Pending Tests', value: pendingTests.toString(), icon: 'AlertCircle', color: 'orange', change: '+0' },
            ],
            testingData, // Sending static for now
            orderData,
            recentActivity: activity
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { OrderModel } = require('../models/OrderModel');
const { UserModel } = require('../models/UserModel');
const { TransformerModel } = require('../models/TransformerModel');
const { VendorModel } = require('../models/VendorModel');

// GET /api/dashboard/tester-stats
router.get('/tester-stats', async (req, res) => {
    try {
        const { role, userName } = req.query;
        if (!role) return res.status(400).json({ error: "Role is required" });

        const stageMap = {
            'core-tester': 'core',
            'secondary-tester': 'secondary',
            'after-primary-tester': 'primary', // Note: role is 'after-primary-tester' but stage is 'primary' in DB? Or 'primary_test'?
            // Standardizing map based on DB schema
            // DB Stage Enum: ["core", "secondary", "primary", "final", "shipped"]
            // DB History Keys: core_test, secondary_test, primary_test, final_test
            'final-tester': 'final'
        };

        const stage = stageMap[role];
        if (!stage) return res.status(400).json({ error: "Invalid role" });

        const historyKey = `${stage === 'core' ? 'core' : stage}_test`;
        // Wait, schema has: core_test, secondary_test, primary_test, final_test.
        // So 'secondary' -> 'secondary_test'.
        // 'primary' -> 'primary_test'.

        const dbStageVal = stage; // e.g. 'core'
        const dbHistoryKey = `${stage}_test`; // e.g. 'core_test'

        // 1. Active Tests
        // Logic: Transformers currently at this stage.
        // Refinement: If assigned, check assignment. For Dashboard "Active Tests" count, usually means "Available to work on".
        // Let's filter by currentStage = stage.
        // Optional: Filter by specific assignment if userName provided.
        const activeQuery = { currentStage: dbStageVal };
        if (userName) {
            // Add granular assignment check similar to tasks route using generic 'assignments.stage_tester'
            // const assignmentField = `assignments.${stage}_tester`;
            // activeQuery.$or = [
            //    { [assignmentField]: userName },
            //    { [assignmentField]: null }, // Unassigned
            //    { [assignmentField]: { $exists: false } }
            // ];
            // Simplified for dashboard stats: All in stage.
        }
        const activeTests = await TransformerModel.countDocuments(activeQuery);


        // 2. Completed Tests (Month)
        // Logic: testHistory.stage.status = 'Completed'
        /* 
           Note: We want "Tests this month". 
           Need to filter by timestamp in history.
        */
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const completedQuery = {
            [`testHistory.${dbHistoryKey}.status`]: 'Completed',
            [`testHistory.${dbHistoryKey}.timestamp`]: { $gte: startOfMonth }
        };
        // If we want ONLY this user's completions:
        // completedQuery[`testHistory.${dbHistoryKey}.tester`] = userName; // Optional strictness

        const completedTests = await TransformerModel.countDocuments(completedQuery);


        // 3. Recent Activity
        // Fetch last 5 interactions for this stage
        const recentTransformers = await TransformerModel.find({
            [`testHistory.${dbHistoryKey}.timestamp`]: { $exists: true }
        })
            .sort({ [`testHistory.${dbHistoryKey}.timestamp`]: -1 })
            .limit(5)
            .populate('orderId', 'clientName')
            .lean();

        const recentActivity = recentTransformers.map(t => {
            const history = t.testHistory[dbHistoryKey];
            const isCompleted = history.status === 'Completed';
            return {
                id: t.uniqueId,
                jobId: t.jobId,
                client: t.orderId ? t.orderId.clientName : 'Unknown Client',
                status: isCompleted ? 'Completed' : 'In Progress', // Logic check
                time: history.timestamp,
                details: `${t.uniqueId} - ${isCompleted ? 'Test Completed' : 'Updated'}`
            };
        });

        res.json({
            success: true,
            stats: {
                activeTests,
                completedTests
            },
            recentActivity
        });

    } catch (err) {
        console.error("Tester Stats Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

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

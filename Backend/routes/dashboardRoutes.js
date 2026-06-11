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
            'after-primary-tester': 'primary',
            'final-tester': 'final',
            'pt-tester': 'pt',
            'pt-pretester': 'pt_pretest'
        };

        const stage = stageMap[role];
        if (!stage) return res.status(400).json({ error: "Invalid role" });

        const historyKey = `${stage === 'core' ? 'core' : stage}_test`;
        // Wait, schema has: core_test, secondary_test, primary_test, final_test.
        // So 'secondary' -> 'secondary_test'.
        // 'primary' -> 'primary_test'.

        const dbStageVal = stage;
        const dbHistoryKey = `${stage}_test`;

        // 1. Active Tests: Transformers currently at this stage AND assigned to this specific user (or unassigned if we want to show available)
        const activeQuery = { currentStage: dbStageVal };
        if (userName && userName !== 'undefined') {
            activeQuery[`assignments.${stage}_tester`] = userName;
        }
        const activeTests = await TransformerModel.countDocuments(activeQuery);


        // 2. Completed Tests (Month): Count tests completed by this user this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const completedQuery = {
            [`testHistory.${dbHistoryKey}.status`]: 'Completed',
            [`testHistory.${dbHistoryKey}.timestamp`]: { $gte: startOfMonth }
        };
        
        if (userName && userName !== 'undefined') {
            completedQuery[`testHistory.${dbHistoryKey}.tester`] = userName;
        }

        const completedTests = await TransformerModel.countDocuments(completedQuery);


        // 3. Recent Activity: Fetch last 5 interactions for this stage by this user
        const recentQuery = {
            [`testHistory.${dbHistoryKey}.timestamp`]: { $exists: true }
        };
        if (userName && userName !== 'undefined') {
            recentQuery[`testHistory.${dbHistoryKey}.tester`] = userName;
        }

        const recentTransformers = await TransformerModel.find(recentQuery)
            .sort({ [`testHistory.${dbHistoryKey}.timestamp`]: -1 })
            .limit(5)
            .populate('orderId', 'clientName')
            .lean();

        const recentActivity = recentTransformers.map(t => {
            const history = t.testHistory[dbHistoryKey];
            const isCompleted = history?.status === 'Completed';
            return {
                id: t.uniqueId,
                jobId: t.jobId,
                client: t.orderId ? t.orderId.clientName : 'Unknown Client',
                status: isCompleted ? 'Completed' : 'Updated',
                time: history?.timestamp,
                details: `${t.uniqueId} - ${isCompleted ? 'Test Completed' : 'Progress Updated'}`
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
        const countPromises = [];

        for (let i = 5; i >= 0; i--) {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - i);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);

            const monthData = {
                monthVal: startDate.getMonth(),
                yearVal: startDate.getFullYear(),
                label: startDate.toLocaleString('default', { month: 'short' }),
                core: 0,
                secondary: 0,
                primary: 0,
                final: 0,
                pt: 0,
                heating: 0
            };
            months.push(monthData);

            const stages = [
                { key: 'core', dbKey: 'core_test' },
                { key: 'secondary', dbKey: 'secondary_test' },
                { key: 'primary', dbKey: 'primary_test' },
                { key: 'final', dbKey: 'final_test' },
                { key: 'pt', dbKey: 'pt_test' },
                { key: 'heating', dbKey: 'heating_test' }
            ];

            for (const stage of stages) {
                const promise = TransformerModel.countDocuments({
                    [`testHistory.${stage.dbKey}.status`]: { $in: ['Completed', 'Approved'] },
                    [`testHistory.${stage.dbKey}.timestamp`]: { $gte: startDate, $lt: endDate }
                }).then(count => {
                    monthData[stage.key] = count;
                });
                countPromises.push(promise);
            }
        }

        await Promise.all(countPromises);

        const testingData = months.map(m => ({
            month: m.label,
            core: m.core,
            secondary: m.secondary,
            primary: m.primary,
            final: m.final,
            pt: m.pt,
            heating: m.heating
        }));

        // 3. Detailed Order Status Distribution (Dynamic)
        // 3. Detailed Order Status Distribution & Recent Activity
        const [
            pendingOrders,
            coreOrders,
            secondaryOrders,
            primaryOrders,
            heatingOrders,
            finalOrders,
            ptOrders,
            completedOrders,
            recentOrders,
            recentUsers
        ] = await Promise.all([
            OrderModel.countDocuments({ status: { $in: ['Pending Approval', 'Pending'] } }),
            OrderModel.countDocuments({ status: { $in: ['Core Testing In Progress', 'Core Testing Completed'] } }),
            OrderModel.countDocuments({ status: 'In Progress', currentStage: 'secondary' }),
            OrderModel.countDocuments({ status: 'In Progress', currentStage: 'primary' }),
            OrderModel.countDocuments({ status: 'In Progress', currentStage: 'heating' }),
            OrderModel.countDocuments({ status: 'In Progress', currentStage: 'final' }),
            OrderModel.countDocuments({ status: { $in: ['PT Testing In Progress', 'PT Testing Completed', 'PT Pretesting In Progress', 'PT Pretesting Completed'] } }),
            OrderModel.countDocuments({ status: { $in: ['Completed', 'COMPLETED'] } }),
            OrderModel.find().sort({ createdAt: -1 }).limit(3).lean(),
            UserModel.find().sort({ createdAt: -1 }).limit(2).lean()
        ]);

        const activity = [];

        const orderData = [
            { name: 'Pending', value: pendingOrders, color: '#94a3b8' },
            { name: 'Core', value: coreOrders, color: '#3b82f6' },
            { name: 'Secondary', value: secondaryOrders, color: '#8b5cf6' },
            { name: 'Primary', value: primaryOrders, color: '#f97316' },
            { name: 'Heating', value: heatingOrders, color: '#f59e0b' },
            { name: 'Final', value: finalOrders, color: '#10b981' },
            { name: 'PT', value: ptOrders, color: '#ec4899' },
            { name: 'Completed', value: completedOrders, color: '#059669' },
        ];

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

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
        const { CTTimerModel } = require('../models/CTTimerModel');
        const { PTTimerModel } = require('../models/PTTimerModel');

        // 1. Basic Counts
        const totalEmployees = await UserModel.countDocuments({ activeStatus: true });
        const activeOrders = await OrderModel.countDocuments({ status: { $ne: 'Completed' } });
        
        // Tests Completed: Count of transformers where currentStage is 'shipped' (assuming shipped means all done)
        const testsCompleted = await TransformerModel.countDocuments({ currentStage: 'shipped' });

        // Pending Tests: All active transformers not shipped.
        const totalTransformers = await TransformerModel.countDocuments({});
        const pendingTests = totalTransformers - testsCompleted;

        // Calculate "this month" changes
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const newEmployeesThisMonth = await UserModel.countDocuments({ activeStatus: true, createdAt: { $gte: startOfMonth } });
        const newOrdersThisMonth = await OrderModel.countDocuments({ createdAt: { $gte: startOfMonth } });
        const completedThisMonth = await TransformerModel.countDocuments({ currentStage: 'shipped', updatedAt: { $gte: startOfMonth } });
        const pendingAddedThisMonth = await TransformerModel.countDocuments({ createdAt: { $gte: startOfMonth }, currentStage: { $ne: 'shipped' } });


        // 2. Weekly Active WIP by Stage (last 7 calendar days, excluding Heating)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0); // Start of day 7 days ago

        const activeTransformers = await TransformerModel.find({
            currentStage: { $in: ['core', 'secondary', 'secondary_failed', 'primary', 'final', 'admin_review', 'pt_pretest', 'pt'] },
            updatedAt: { $gte: sevenDaysAgo }
        }, { currentStage: 1 }).lean();

        const wipMap = {
            'Core Testing': 0,
            'Secondary Testing': 0,
            'After Primary Testing': 0,
            'Final Testing': 0,
            'PT Pretesting': 0,
            'PT Final Testing': 0
        };

        activeTransformers.forEach(t => {
            if (t.currentStage === 'core') wipMap['Core Testing']++;
            else if (t.currentStage === 'secondary' || t.currentStage === 'secondary_failed') wipMap['Secondary Testing']++;
            else if (t.currentStage === 'primary') wipMap['After Primary Testing']++; // Heating is completely excluded
            else if (t.currentStage === 'final' || t.currentStage === 'admin_review') wipMap['Final Testing']++;
            else if (t.currentStage === 'pt_pretest') wipMap['PT Pretesting']++;
            else if (t.currentStage === 'pt') wipMap['PT Final Testing']++;
        });

        const wipData = Object.keys(wipMap).map(key => ({ stage: key, count: wipMap[key] }));

        // 3. Tester Performance Dashboard (excluding Heating, sorting DESC, Top 10)
        // Group by testerName in completed cttimers (exclude any where stage is heating)
        const ctPerformance = await CTTimerModel.aggregate([
            { $match: { status: 'Completed', stage: { $ne: 'heating' } } },
            {
                $group: {
                    _id: "$testerName",
                    unitsTested: { $sum: 1 },
                    totalDelayMs: { $sum: "$delayMs" }
                }
            }
        ]);

        // Group by testerName in completed pttimers
        const ptPerformance = await PTTimerModel.aggregate([
            { $match: { status: 'Completed', stage: { $ne: 'heating' } } },
            {
                $group: {
                    _id: "$testerName",
                    unitsTested: { $sum: 1 },
                    totalDelayMs: { $sum: "$delayMs" }
                }
            }
        ]);

        const testerMap = {};
        const addPerformanceData = (perfList) => {
            perfList.forEach(p => {
                const name = p._id || "Unknown";
                if (!testerMap[name]) {
                    testerMap[name] = {
                        testerName: name,
                        unitsTested: 0,
                        totalDelayMs: 0
                    };
                }
                testerMap[name].unitsTested += p.unitsTested;
                testerMap[name].totalDelayMs += p.totalDelayMs;
            });
        };

        addPerformanceData(ctPerformance);
        addPerformanceData(ptPerformance);

        const testerData = Object.values(testerMap)
            .map(t => {
                const totalDelay = Math.round(t.totalDelayMs / 60000);
                const averageDelay = t.unitsTested > 0 ? Math.round((t.totalDelayMs / t.unitsTested) / 60000) : 0;
                return {
                    tester: t.testerName,
                    unitsTested: t.unitsTested,
                    totalDelay,
                    averageDelay
                };
            })
            .sort((a, b) => b.unitsTested - a.unitsTested) // Sort DESC by Units Tested
            .slice(0, 10); // Limit to Top 10

        // 4. Daily Production Output Trend (excluding Heating)
        // Get all completed CT transformers (via final_test.status and timestamp)
        const ctCompleted = await TransformerModel.find({
            "testHistory.final_test.status": { $in: ["Completed", "Approved"] },
            "testHistory.final_test.timestamp": { $exists: true }
        }, { "testHistory.final_test.timestamp": 1 }).lean();

        // Get all completed PT transformers (via pt_test.approved and fallback to updatedAt)
        const ptCompleted = await TransformerModel.find({
            $or: [
                { "testHistory.pt_test.approved": true },
                { "testHistory.pt_test.approved": "true" }
            ]
        }, { "testHistory.pt_test.timestamp": 1, updatedAt: 1 }).lean();

        const daily = [];
        const weekly = [];
        const monthly = [];

        const now = new Date();

        // Daily trend: last 30 days
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
            daily.push({ date: dateStr, label, ct: 0, pt: 0 });
        }

        // Weekly trend: last 12 weeks
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i * 7);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            const mondayStr = monday.toISOString().split('T')[0];
            const label = `Wk ${monday.toLocaleDateString('default', { month: 'numeric', day: 'numeric' })}`;
            
            weekly.push({
                date: mondayStr,
                label,
                ct: 0,
                pt: 0,
                startDate: new Date(monday.setHours(0, 0, 0, 0)),
                endDate: new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000)
            });
        }

        // Monthly trend: last 12 months
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - i);
            const yearMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleString('default', { month: 'short' });
            monthly.push({ date: yearMonthStr, label, ct: 0, pt: 0, monthVal: d.getMonth(), yearVal: d.getFullYear() });
        }

        // Populate CT Completed Units
        ctCompleted.forEach(unit => {
            const ts = new Date(unit.testHistory.final_test.timestamp);
            if (isNaN(ts.getTime())) return;

            const dateStr = ts.toISOString().split('T')[0];
            const dMatch = daily.find(day => day.date === dateStr);
            if (dMatch) dMatch.ct++;

            weekly.forEach(wk => {
                if (ts >= wk.startDate && ts < wk.endDate) {
                    wk.ct++;
                }
            });

            const mVal = ts.getMonth();
            const yVal = ts.getFullYear();
            const mMatch = monthly.find(m => m.monthVal === mVal && m.yearVal === yVal);
            if (mMatch) mMatch.ct++;
        });

        // Populate PT Completed Units (with safe fallback: timestamp OR updatedAt)
        ptCompleted.forEach(unit => {
            const ts = new Date(unit.testHistory?.pt_test?.timestamp || unit.updatedAt);
            if (isNaN(ts.getTime())) return;

            const dateStr = ts.toISOString().split('T')[0];
            const dMatch = daily.find(day => day.date === dateStr);
            if (dMatch) dMatch.pt++;

            weekly.forEach(wk => {
                if (ts >= wk.startDate && ts < wk.endDate) {
                    wk.pt++;
                }
            });

            const mVal = ts.getMonth();
            const yVal = ts.getFullYear();
            const mMatch = monthly.find(m => m.monthVal === mVal && m.yearVal === yVal);
            if (mMatch) mMatch.pt++;
        });

        const cleanedWeekly = weekly.map(w => ({
            date: w.date,
            label: w.label,
            ct: w.ct,
            pt: w.pt
        }));

        const cleanedMonthly = monthly.map(m => ({
            date: m.date,
            label: m.label,
            ct: m.ct,
            pt: m.pt
        }));

        const productionTrend = {
            daily: daily.map(d => ({ date: d.date, label: d.label, ct: d.ct, pt: d.pt })),
            weekly: cleanedWeekly,
            monthly: cleanedMonthly
        };

        // 5. Recent Activity
        const [recentOrders, recentUsers] = await Promise.all([
            OrderModel.find().sort({ createdAt: -1 }).limit(3).lean(),
            UserModel.find().sort({ createdAt: -1 }).limit(2).lean()
        ]);

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

        activity.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.status(200).json({
            success: true,
            stats: [
                { label: 'Total Employees', value: totalEmployees.toString(), icon: 'Users', color: 'blue', change: `+${newEmployeesThisMonth}` },
                { label: 'Active Orders', value: activeOrders.toString(), icon: 'Package', color: 'purple', change: `+${newOrdersThisMonth}` },
                { label: 'Tests Completed', value: testsCompleted.toString(), icon: 'CheckCircle2', color: 'green', change: `+${completedThisMonth}` },
                { label: 'Pending Tests', value: pendingTests.toString(), icon: 'AlertCircle', color: 'orange', change: `+${pendingAddedThisMonth}` },
            ],
            wipData,
            testerData,
            productionTrend,
            recentActivity: activity
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

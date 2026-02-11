const { OrderModel } = require("../models/OrderModel");
const { UserModel } = require("../models/UserModel");
const { TransformerModel } = require("../models/TransformerModel");

// Helper to get start and end of current day
const getTodayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

// Helper to get start of current month
const getStartOfMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

// 1. Dashboard Overview Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const { start, end } = getTodayRange();

        // Current Orders (In Progress)
        const currentOrders = await OrderModel.countDocuments({ status: { $ne: "Completed" }, isApproved: true });
        
        // Active Workers (Users with activeStatus: true)
        const activeWorkers = await UserModel.countDocuments({ activeStatus: true });

        // Pending Tests (Transformers with uncompleted stages)
        // A transformer is pending if it's not in 'completed' stage
        const pendingTests = await TransformerModel.countDocuments({ currentStage: { $ne: "completed" } });

        // Dispatched Today (Orders Completed Today)
        // Assumption: "Completed" status implies dispatched for now
        const dispatchedToday = await OrderModel.countDocuments({
            status: "Completed",
            updatedAt: { $gte: start, $lte: end }
        });

        res.status(200).json({
            success: true,
            stats: {
                currentOrders,
                activeWorkers,
                pendingTests,
                dispatchedToday
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ success: false, error: "Failed to fetch dashboard stats" });
    }
};

exports.getProductionOverview = async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const productionData = await OrderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { 
                        month: { $month: "$createdAt" }, 
                        year: { $year: "$createdAt" } 
                    },
                    count: { $sum: 1 }, 
                    totalUnits: { $sum: "$quantity" },
                    revenue: { $sum: { $multiply: ["$quantity", 50000] } }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Format for Recharts
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedData = productionData.map(item => ({
            month: monthNames[item._id.month - 1],
            production: item.totalUnits,
            orders: item.count,
            revenue: item.revenue / 1000, 
            efficiency: Math.floor(Math.random() * (95 - 80 + 1)) + 80 
        }));

        res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Error fetching production overview:", error);
        res.status(500).json({ success: false, error: "Failed to fetch production overview", details: error.message });
    }
};

// 3. Transformer Distribution (Pie Chart)
exports.getTransformerDistribution = async (req, res) => {
    try {
        const distribution = await OrderModel.aggregate([
            {
                $group: {
                    _id: "$transformerType", // or "$transformerName" if available/consistent
                    value: { $sum: "$quantity" }
                }
            }
        ]);

        const formattedData = distribution.map((item, index) => ({
            name: item._id,
            value: item.value,
            color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'][index % 5] // Assign colors
        }));

        res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Error fetching transformer distribution:", error);
        res.status(500).json({ success: false, error: "Failed to fetch transformer distribution" });
    }
};

// 4. Testing Progress (Bar Chart)
exports.getTestingProgress = async (req, res) => {
    try {
        const progress = await TransformerModel.aggregate([
            { $group: { _id: "$currentStage", count: { $sum: 1 } } }
        ]);

        const counts = { core: 0, secondary: 0, primary: 0, final: 0, completed: 0, shipped: 0 };
        
        progress.forEach(p => { 
            if (counts.hasOwnProperty(p._id)) { 
                counts[p._id] = p.count; 
            } 
        });

        // 'shipped' and 'completed' are both considered fully done
        const totalCompleted = counts.completed + counts.shipped;

        // Waterfall logic:
        // Pending = Currently at this stage
        // Completed = Successfully passed this stage (i.e., is at a later stage)
        const finalData = [
            { 
                stage: 'Core Testing', 
                completed: counts.secondary + counts.primary + counts.final + totalCompleted, 
                pending: counts.core 
            },
            { 
                stage: 'Secondary Testing', 
                completed: counts.primary + counts.final + totalCompleted, 
                pending: counts.secondary 
            },
            { 
                stage: 'Primary Testing', 
                completed: counts.final + totalCompleted, 
                pending: counts.primary 
            },
            { 
                stage: 'Final Testing', 
                completed: totalCompleted, 
                pending: counts.final 
            },
        ];
        res.status(200).json({ success: true, data: finalData });
    } catch (error) {
        console.error("Error fetching testing progress:", error);
        res.status(500).json({ success: false, error: "Failed to fetch testing progress" });
    }
};

// 5. Recent Activity
exports.getRecentActivity = async (req, res) => {
    try {
        // Fetch recent orders
        const recentOrders = await OrderModel.find()
            .sort({ updatedAt: -1 })
            .limit(5)
            .lean();

        const activity = recentOrders.map(order => {
            let action = "Updated";
            let type = "info";
            
            if (order.status === "Pending Approval") {
                action = "New order received";
                type = "success";
            } else if (order.status === "Completed") {
                action = "Order Completed";
                type = "success";
            } else if (order.status === "In Progress") {
                action = "Order In Progress";
                type = "info";
            }

            return {
                action,
                detail: `${order.transformerType} - ${order.jobId}`,
                time: new Date(order.updatedAt).toLocaleDateString(), // simplified
                timestamp: order.updatedAt, // for frontend relative time
                type
            };
        });

        res.status(200).json({ success: true, data: activity });
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        res.status(500).json({ success: false, error: "Failed to fetch recent activity" });
    }
};

// 6. Advanced Analytics API
exports.getAdvancedAnalytics = async (req, res) => {
    try {
        // KPIs
        const totalRevenue = await OrderModel.aggregate([
            { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", 50000] } } } } // Mock price 50000
        ]);
        
        const avgOrderValue = await OrderModel.aggregate([
            { $group: { _id: null, avg: { $avg: { $multiply: ["$quantity", 50000] } } } }
        ]);

        const completedOrders = await OrderModel.countDocuments({ status: "Completed" });
        const totalOrders = await OrderModel.countDocuments({});
        const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

        // KPI Mock Response (mix of real + mock for unavailable data)
        const kpis = [
            {
                label: 'Total Revenue (Est.)',
                value: `₹${(totalRevenue[0]?.total || 0).toLocaleString()}`,
                change: '+15%',
                trending: 'up',
                icon: 'DollarSign',
            },
            {
                label: 'Avg. Order Value',
                value: `₹${Math.round(avgOrderValue[0]?.avg || 0).toLocaleString()}`,
                change: '+5%',
                trending: 'up',
                icon: 'PieChart',
            },
             {
                label: 'Completion Rate',
                value: `${completionRate.toFixed(1)}%`,
                change: '+2%',
                trending: 'up',
                icon: 'Activity',
            }
        ];

        // Advanced Performance Data (Same logic as Production Overview but with Revenue)
        // ... (Reusing logic for brevity, can be expanded)
        
        // Mock Worker Performance 
        // Real implementation would require summing aggregated stats per user assignment
        // For now, returning existing mock structure but ready for dynamic switch
        const workerPerformance = [
             { name: 'Rahul Sharma', completed: 45, efficiency: 92, quality: 95 },
             { name: 'Amit Verma', completed: 38, efficiency: 88, quality: 90 },
             { name: 'Neha Patil', completed: 42, efficiency: 94, quality: 96 }
        ];

        res.status(200).json({ 
            success: true, 
            kpis,
            workerPerformance,
            // Add other sections as needed
        });

    } catch (error) {
        console.error("Error fetching advanced analytics:", error);
         res.status(500).json({ success: false, error: "Failed to fetch advanced analytics" });
    }
};

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

// 2. Production Overview (Orders grouped by Month)
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
                    _id: { $month: "$createdAt" },
                    year: { $year: "$createdAt" }, // Keep year to sort correctly across year boundary
                    count: { $sum: 1 }, // Simple count of orders
                    totalUnits: { $sum: "$quantity" },
                    // Mock revenue calculation: quantity * 50000
                    revenue: { $sum: { $multiply: ["$quantity", 50000] } }
                }
            },
            { $sort: { year: 1, _id: 1 } }
        ]);

        // Format for Recharts
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedData = productionData.map(item => ({
            month: monthNames[item._id - 1],
            production: item.totalUnits,
            orders: item.count,
            revenue: item.revenue / 1000, // Convert to K for easier reading
            efficiency: Math.floor(Math.random() * (95 - 80 + 1)) + 80 // Mock efficiency between 80-95%
        }));

        res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Error fetching production overview:", error);
        res.status(500).json({ success: false, error: "Failed to fetch production overview" });
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
        // Aggregate transformers by `currentStage`
        const progress = await TransformerModel.aggregate([
            {
                $group: {
                    _id: "$currentStage",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Map stages to visualization format
        const stageMap = {
            "core": "Core/Visual",
            "secondary": "Secondary/Electrical",
            "primary": "Primary/Performance",
            "final": "Final QC"
        };
        
        // Ensure all stages are represented even if count is 0
        const stages = ["core", "secondary", "primary", "final"];
        const formattedData = await Promise.all(stages.map(async (stage) => {
            const found = progress.find(p => p._id === stage);
            const count = found ? found.count : 0;
            
            // For pending vs completed, we can estimate details
            // This assumes all in that stage are "pending" completion of that stage
            // And those in subsequent stages are "completed" for this stage
            // This is a simplification for visualization
            
            return {
                stage: stageMap[stage] || stage,
                pending: count, 
                completed: 0 // We'd need more complex logic to know completed history of *previous* stages for accurate "completed" bars
            };
        }));
        
        // Refined Logic:
        // Visual Inspection (Core) -> Completed = Sum(Secondary + Primary + Final + Completed), Pending = Core
        // Electrical Test (Secondary) -> Completed = Sum(Primary + Final + Completed), Pending = Secondary
        // ...
        
        const counts = {
            core: 0, secondary: 0, primary: 0, final: 0, completed: 0
        };
        
        progress.forEach(p => {
            if (counts.hasOwnProperty(p._id)) {
                counts[p._id] = p.count;
            }
        });

        // "completed" implies it passed all previous stages
        const finalData = [
            { 
                stage: 'Visual Inspection', 
                completed: counts.secondary + counts.primary + counts.final + counts.completed, 
                pending: counts.core 
            },
            { 
                stage: 'Electrical Test', 
                completed: counts.primary + counts.final + counts.completed, 
                pending: counts.secondary 
            },
            { 
                stage: 'Performance Test', 
                completed: counts.final + counts.completed, 
                pending: counts.primary 
            },
            { 
                stage: 'Final QC', 
                completed: counts.completed, 
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

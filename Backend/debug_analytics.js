require("dotenv").config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');

const uri = process.env.MONGO_URL;

mongoose.connect(uri)
  .then(async () => {
    console.log("Connected to MongoDB for debugging.");
    try {
        console.log("Running aggregation...");
        const stats = await TransformerModel.aggregate([
            {
                $facet: {
                    stageDistribution: [
                        { $group: { _id: "$currentStage", count: { $sum: 1 } } }
                    ],
                    totals: [
                        {
                            $group: {
                                _id: null,
                                totalUnits: { $sum: 1 },
                                completedUnits: {
                                    $sum: { $cond: [{ $eq: ["$currentStage", "shipped"] }, 1, 0] }
                                },
                                pendingUnits: {
                                    $sum: { $cond: [{ $in: ["$currentStage", ["shipped", "rejected"]] }, 0, 1] }
                                },
                                rejectedUnits: {
                                    $sum: { $cond: [{ $eq: ["$currentStage", "admin_review"] }, 1, 0] }
                                }
                            }
                        }
                    ],
                    monthlyTrend: [
                        {
                            $match: {
                                "testHistory.final_test.status": "Completed"
                            }
                        },
                        {
                            $project: {
                                date: { $toDate: "$testHistory.final_test.timestamp" }
                            }
                        },
                        {
                            $match: {
                                date: { $ne: null, $type: "date" }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    month: { $month: "$date" },
                                    year: { $year: "$date" }
                                },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { "_id.year": -1, "_id.month": -1 } },
                        { $limit: 6 }
                    ]
                }
            }
        ]);
        console.log("Aggregation Result Successfully Fetched.");

        const { OrderModel } = require('./models/OrderModel');
        const totalOrders = await OrderModel.countDocuments({});
        console.log("Total Orders:", totalOrders);

    } catch (err) {
        console.error("DEBUG ERROR STACK:", err.stack || err);
    } finally {
        mongoose.disconnect();
    }
  })
  .catch(err => console.error("Connection Error:", err));

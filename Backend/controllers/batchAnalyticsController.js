const { PreTestBatchModel } = require('../models/PreTestBatchModel');
const ReadyTransformer = require('../models/ReadyTransformerModel');
const { FailedCoreModel } = require('../models/FailedCoreModel');

exports.getBatchAnalytics = async (req, res) => {
  try {
    const totalBatches = await PreTestBatchModel.countDocuments();
    const completedBatches = await PreTestBatchModel.countDocuments({ status: "COMPLETED" });
    const inProgressBatches = await PreTestBatchModel.countDocuments({ status: "IN_PROGRESS" });

    // Aggregating counts from batches
    const batchStats = await PreTestBatchModel.aggregate([
      {
        $group: {
          _id: null,
          totalPassed: { $sum: "$passedCount" },
          totalFailed: { $sum: "$failedCount" }
        }
      }
    ]);

    const stats = batchStats[0] || { totalPassed: 0, totalFailed: 0 };
    const totalCores = stats.totalPassed + stats.totalFailed;
    const passRate = totalCores > 0 ? ((stats.totalPassed / totalCores) * 100).toFixed(1) : 0;

    res.status(200).json({
      summary: {
        totalBatches,
        completedBatches,
        inProgressBatches,
        totalPassed: stats.totalPassed,
        totalFailed: stats.totalFailed,
        passRate: `${passRate}%`
      },
      typeDistribution: await ReadyTransformer.aggregate([
        { $group: { _id: "$coreType", count: { $sum: 1 } } }
      ])
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching analytics", error: err.message });
  }
};

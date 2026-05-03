const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/authMiddleware");
const {
  createBatch,
  getBatches,
  getBatchById,
  updateBatchStatus,
  saveBatchReading,
  discardCore,
  approveBatch,
  deleteBatch
} = require("../controllers/preTestBatchController");

const { getBatchAnalytics } = require("../controllers/batchAnalyticsController");

router.post("/create", isAuthenticated, createBatch);
router.get("/analytics", isAuthenticated, getBatchAnalytics);
router.get("/", isAuthenticated, getBatches);
router.get("/:batchId", isAuthenticated, getBatchById);
router.patch("/:batchId/status", isAuthenticated, updateBatchStatus);
router.patch("/:batchId", isAuthenticated, updateBatchStatus); // General update
router.post("/:batchId/save-reading", isAuthenticated, saveBatchReading);
router.post("/:batchId/discard-core", isAuthenticated, discardCore);
router.post("/:batchId/approve", isAuthenticated, approveBatch);
router.delete("/:batchId", isAuthenticated, deleteBatch);

module.exports = router;

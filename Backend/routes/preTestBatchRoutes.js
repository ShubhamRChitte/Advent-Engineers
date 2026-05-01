const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/authMiddleware");
const {
  createBatch,
  getBatches,
  getBatchById,
  updateBatchStatus
} = require("../controllers/preTestBatchController");

const { getBatchAnalytics } = require("../controllers/batchAnalyticsController");

router.post("/create", isAuthenticated, createBatch);
router.get("/analytics", isAuthenticated, getBatchAnalytics);
router.get("/", isAuthenticated, getBatches);
router.get("/:batchId", isAuthenticated, getBatchById);
router.patch("/:batchId/status", isAuthenticated, updateBatchStatus);

module.exports = router;

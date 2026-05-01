const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/authMiddleware");
const {
  addReadyTransformer,
  batchAddReadyTransformers,
  getAllReadyTransformers,
  getAvailableReadyTransformers,
  reserveReadyTransformer,
  useReadyTransformer,
  getReadyStockAnalytics
} = require("../controllers/readyTransformerController");

router.get("/", isAuthenticated, getAllReadyTransformers);
router.post("/add", isAuthenticated, addReadyTransformer);
router.post("/batch-add", isAuthenticated, batchAddReadyTransformers);

router.get("/available", isAuthenticated, getAvailableReadyTransformers);
router.post("/reserve/:id", isAuthenticated, reserveReadyTransformer);
router.post("/use/:id", isAuthenticated, useReadyTransformer);
router.get("/analytics", isAuthenticated, getReadyStockAnalytics);

module.exports = router;

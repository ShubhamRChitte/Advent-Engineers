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
  getReadyStockAnalytics,
  getAvailableForOrder,
  getAssignedToOrder,
  assignToOrder,
  testIndividualReadyTransformer
} = require("../controllers/readyTransformerController");

router.get("/", isAuthenticated, getAllReadyTransformers);
router.post("/add", isAuthenticated, addReadyTransformer);
router.post("/batch-add", isAuthenticated, batchAddReadyTransformers);
router.post("/test-individual/:id", isAuthenticated, testIndividualReadyTransformer);

router.get("/available", isAuthenticated, getAvailableReadyTransformers);
router.post("/reserve/:id", isAuthenticated, reserveReadyTransformer);
router.post("/use/:id", isAuthenticated, useReadyTransformer);
router.get("/analytics", isAuthenticated, getReadyStockAnalytics);

// New order-based ready core assignment routes
router.get("/available-for-order/:orderId", isAuthenticated, getAvailableForOrder);
router.get("/assigned-to-order/:orderId", isAuthenticated, getAssignedToOrder);
router.post("/assign-to-order", isAuthenticated, assignToOrder);

module.exports = router;

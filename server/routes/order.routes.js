const express = require("express");
const router = express.Router();

const {
  getAllOrders,
  getOrderById,
  getOrderTransformers,
} = require("../controllers/order.controller");

router.get("/", getAllOrders);
router.get("/:orderId", getOrderById);
router.get("/:orderId/transformers", getOrderTransformers);

module.exports = router;

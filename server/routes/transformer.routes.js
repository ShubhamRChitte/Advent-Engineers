const express = require("express");
const router = express.Router();

const {
  getTransformersByOrder,
  updateTransformerStatus
} = require("../controllers/transformer.controller");

// GET all transformers of an order
router.get("/orders/:orderId/transformers", getTransformersByOrder);

// UPDATE transformer status
router.patch("/:id", updateTransformerStatus);

module.exports = router;

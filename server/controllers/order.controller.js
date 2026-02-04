const Order = require("../models/Order.model");

/**
 * GET /api/orders
 */
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/orders/:orderId
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ jobId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const Transformer = require("../models/Transformer.model");

/**
 * GET /api/orders/:orderId/transformers
 */
const getOrderTransformers = async (req, res) => {
  try {
    const transformers = await Transformer.find({
      orderId: req.params.orderId
    }).sort({ transformerId: 1 });

    res.json(transformers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = {
  getAllOrders,
  getOrderById,
  getOrderTransformers
};
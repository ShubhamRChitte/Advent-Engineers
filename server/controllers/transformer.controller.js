const Transformer = require("../models/Transformer.model");

/**
 * GET transformers by order
 * /api/transformers/orders/:orderId/transformers
 */
const getTransformersByOrder = async (req, res) => {
  try {
    const transformers = await Transformer.find({
      orderId: req.params.orderId
    }).sort({ transformerId: 1 });

    res.json(transformers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PATCH update transformer testing status
 * /api/transformers/:id
 */
const updateTransformerStatus = async (req, res) => {
  try {
    const transformer = await Transformer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!transformer)
      return res.status(404).json({ message: "Transformer not found" });

    res.json(transformer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getTransformersByOrder,
  updateTransformerStatus
};

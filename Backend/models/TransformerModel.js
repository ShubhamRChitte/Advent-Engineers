const { model } = require("mongoose");
const { TransformerSchema } = require("../schema/TransformerSchema");

const TransformerModel = model("Transformer", TransformerSchema);

module.exports = { TransformerModel };

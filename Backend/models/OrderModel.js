const { model } = require("mongoose");
const { OrderSchema } = require("../schema/OrderSchema");

const OrderModel = model("Order", OrderSchema);

module.exports = { OrderModel };

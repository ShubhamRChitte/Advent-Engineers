const {model} = require("mongoose");

const {CustomerSchema} = require("../schema/CustomerSchema");
const CustomerModel = new model("customer",CustomerSchema);

module.exports = {CustomerModel};
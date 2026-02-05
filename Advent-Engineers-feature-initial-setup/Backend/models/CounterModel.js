const {model} = require("mongoose");

const {CounterSchema} = require("../schema/ConterSchema");
const CounterModel = new model("counter",CounterSchema);

module.exports = {CounterModel};
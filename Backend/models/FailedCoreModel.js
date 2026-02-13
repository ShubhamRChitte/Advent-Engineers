const { model } = require("mongoose");
const { FailedCoreSchema } = require("../schema/FailedCoreSchema");

const FailedCoreModel = model("FailedCore", FailedCoreSchema);

module.exports = { FailedCoreModel };

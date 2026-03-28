const { model } = require("mongoose");
const { HeatingRecordSchema } = require("../schema/HeatingRecordSchema");

const HeatingRecordModel = model("HeatingRecord", HeatingRecordSchema);

module.exports = { HeatingRecordModel };
